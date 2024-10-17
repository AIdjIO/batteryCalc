/**
 * This function reads values from textarea and processes
 * the data to generate speed array [m/s] and data labels
 * ready to use for plotting purpose.
 * 
 * @returns {array} of 2 arrays of speed data and labels.
 */
export function getData(){
    let textareaSpeed = document.getElementsByTagName("textarea")[0];

    let textareaSpeedArray = 
        (textareaSpeed.value).replace(/(^\s*,)|(,\s*$)/g, '')
                             .split(',')
                             .map(val => parseFloat(val)/3.6);
    let textareaSpeedLabel = 
        [...Array(textareaSpeedArray.length).keys()];

    return [ textareaSpeedLabel, textareaSpeedArray ];
}

/**
 * calculates cycle distance
 * @param {array} speeds expect speeds in km/h at 1s sample time
 * @returns {array} of 2 arrays of speed data and labels.
 */
export function cycleDistance(speeds){
    return ((speeds.reduce((a, b) => a + b, 0) || 0) );
}
/**
 * generates output text of vehicle speed cycle calculated statistics
 * this function calculates the min, max, average speed of the cycle
 * and the total distance in km.
 * speed cycle is specified in km/h with a sample time of one second.
 * 
 * @param {array} speeds
 */
export function calculateSpeedInfo(speeds){
    
    let speedInfo = document.getElementById('speed_info');
    // calculate the difference between 2 consecutive speed to get
    // acceleration values.
    let accelerationValues = speeds.map((v,i)=>((speeds[i+1] || 0) - v));

    // get positive acceleration values
    let positiveAccValues = accelerationValues.filter(v => v > 0);
    
    let averageAcceleration = ( positiveAccValues.reduce((a, b) => a + b, 0) 
                            / positiveAccValues.length ).toFixed(3);

    // get negative acceleration values
    let negativeAccValues = accelerationValues.filter(v => v < 0)

    let averageDeceleration = ( negativeAccValues.reduce((a, b) => a + b, 0)
                            / negativeAccValues.length )
                            . toFixed(3);

    let totalDistance = cycleDistance(speeds);
    let averageSpeed = (totalDistance / speeds.length || 0).toFixed(2) ;

    speedInfo.innerHTML = `<i>This drive cycle has a minimum speed of ${ (3.6 * Math.min(...speeds)).toFixed(2)||0 } km/h, 
                                 a maximum speed of ${ (3.6 * Math.max(...speeds)).toFixed(2)||0 } km/h,
                                 an average speed of ${ (3.6 * averageSpeed).toFixed(2) } km/h, an average acceleration of ${ averageAcceleration } m/s², 
                                 an average deceleration of ${ averageDeceleration } m/s²and 
                                 a total distance of ${ (totalDistance / 1000).toFixed(2) } km</i>`
}

/**
 * calculate acceleration values from speed array [m/s2]
 * assuming sample time of 1s.
 * 
 * @param {array} speeds 
 * @returns array
 */
export function acceleration(speeds) {
    return speeds.map( (v,i) => ( v - (speeds[i-1] || 0)) );
}

/**
 * calculate all forces [N] on vehicle asuming sample time of 1s.
 * @param {array} speeds 
 * @returns {array} 
 */
export function total_forces(speeds) {
    const GRAVITY = 9.81;

    let mass = document.getElementById('edit-vehicle-mass').value;
    let Cd = document.getElementById('edit-drag-coefficient').value;
    let A = document.getElementById('edit-frontal-area').value;
    let Crr = document.getElementById('edit-rolling-resistance').value;  
    let rho = document.getElementById('edit-air-density').value;
    let alpha = document.getElementById('edit-road-slope').value * Math.PI/180;


    return (speeds).map((v,i) =>( mass * ((v - (speeds[i-1] || 0) ) 
                                        + GRAVITY * Crr * Math.cos(alpha)
                                        + GRAVITY * Math.sin(alpha))
                                        + 0.5 * rho * Cd * A * v * v ));    
}

/**
 * calculate wheel radius [m] on based on tyre dimensions.
 * @returns {float} 
 */
function wheel_radius(){
    let wheel = document .getElementById('edit-wheel-radius');
    let R = wheel.options[wheel.selectedIndex].text; //[m]

    let [tyre_width, tyre_AR, rim_dia] = R.split(/[\/,R]/);
    
    let wheel_R = (100 * +tyre_AR / +tyre_width + +rim_dia / 2) / 1000;

    return wheel_R;
}

/**
 * calculate wheel torque [NM] on vehicle asuming sample time of 1s.
 * @param {array} speeds 
 * @param {string} wheel //example format 205/55R16
 * @returns {array} 
 */
export function wheel_torque(speeds) {
    let R = wheel_radius();
    return total_forces(speeds).map(v => v * R)
}

/**
 * calculate wheel torque [NM] on vehicle asuming sample time of 1s.
 * @param {object} data 
 * @returns {array} 
 */
export function motorTrqDmnd(speeds) {

    let diff_ratio = document .getElementById('edit-drive-ratio-differential').value; //[m]
    let gear_ratio = document .getElementById('edit-drive-ratio-gear').value; //[m]
    return wheel_torque(speeds).map(v=>v/diff_ratio/gear_ratio);
}

/**
 * Calculates the total power demand [kWh]
 * from the speed cycle in [kw] not including ancillary loads
 * @param {object} data 
 * @returns {array}
 */
export function total_cycle_power(speeds){

    let distance = cycleDistance(speeds)/1000; //[km]
    
    //get ancillary loads
    let ancillaryLoadEnergy = document.getElementById('edit-ancillary-energy').value
    / 1000; //[kWh/km]
    let ancillaryLoadEnergyPerSecond = ancillaryLoadEnergy 
                  * distance / speeds.length //[kwh/s];

    return total_forces(speeds).map( (f, i) => f * speeds[i] / 1000
                                     + ancillaryLoadEnergyPerSecond );
}

/**
 * returns the vehicle motor power based on user powertrain selection and input
 * @param {string} curr equal to 'peak' or 'cont'
 * @returns {number} the total motor power available in the vehicle
 */
export function totalMotorPower( curr ){
    if (curr == 'peak') {    
        let fr_motor_pwr_pk = document.querySelectorAll("[data-drupal-selector='edit-front-motor-power-peak']")[0];
        let rr_motor_pwr_pk = document.querySelectorAll("[data-drupal-selector='edit-rear-motor-power-peak']")[0];
    
        return (fr_motor_pwr_pk ? +fr_motor_pwr_pk.value : 0 ) + (rr_motor_pwr_pk ? +rr_motor_pwr_pk.value : 0)
    }

    let fr_motor_pwr_cont = document.querySelectorAll("[data-drupal-selector='edit-front-motor-power-continuous']")[0];
    let rr_motor_pwr_cont = document.querySelectorAll("[data-drupal-selector='edit-rear-motor-power-continuous']")[0];

    return (fr_motor_pwr_cont ? +fr_motor_pwr_cont.value : 0 ) + (rr_motor_pwr_cont ? +rr_motor_pwr_cont.value : 0)
}

/**
 * Calculates the motor power on the cycle considering 
 * regen braking level and peak motor power
 * @param {array} speeds 
 * @returns motor power peak
 */
export function motorPwrActual(speeds, curr = 'peak'){
    let powerDmnd = total_cycle_power( speeds );
    let motorPower = totalMotorPower( curr );

    //powertrain efficiency (conversion from electrical to mechanical)
    let eff = document.getElementById('edit-powertrain-efficiency').value;
    let regen = document.getElementById('edit-regen-capacity').value;

    return powerDmnd.map(v => {
        if (v / eff >= motorPower){
            return motorPower;
        }
        if (v / eff < -motorPower * regen / 100) {
            return -motorPower * regen / 100;
        }
        return v / eff;
    });
}

/**
 * returns voltage architecture
 * @returns {number} voltage architecture of vehicule in Volts
 */
export function voltageArchitecture(){
    return document.getElementById('edit-voltage-architecture-0').checked? 400 : 800;
}

/**
 * Calculates SOC from current of continuous power from motor
 * @param {array} speeds 
 * @returns {array} soc
 */
export function SOC(speeds, curr){
    let E = 1e3*document.getElementById("edit-pack-size").value;
    let V = voltageArchitecture();

    let C = E/V;

    let current = currentActual(speeds, curr);
    let soc = 100; // start with a full battery
    
    return current.map((i => soc = Math.min(soc,100) - 100 * i / C / 3600))
}

/**
 * Contiunous current
 * (v -Ri)*i = P, Ri2 -vi + P = 0
 * @param {array} speeds 
 * @returns {array} of current for motor in continuous operation
 */
export function currentActual(speeds, curr){
    let actualPwr = motorPwrActual(speeds, curr);
    let voltage_architecture = document.querySelectorAll('input[type="radio"]:checked');
    let V;

   for (let radio of voltage_architecture){
    if (radio.checked){
        V = radio.value == "0" ? 400: 800;
    }
   }

    // let R = 0.1; // pack resistance
    let R = packResitance() / 1000;

    return actualPwr.map(p => (V - Math.sqrt(V * V - 4 * R * p * 1000)) / 2 / R )
}

/**
 * Calculate Pack S/P config
 * @param {number} packSize battery pack energy in kwh
 * @returns {array} [S, P],  S = num cell in series, P = num cells in parallel
 */
export function packSP(packSize){
    let nomV = document.querySelector('input[data-drupal-selector = "edit-cell-voltage-nom"]').value
    let cellCapacity = document.querySelector('input[data-drupal-selector = "edit-cell-capacity"]').value
    let packNominalVoltage = voltageArchitecture();

    let numCellsSeries = Math.ceil( packNominalVoltage / nomV );
    let numCellsParallel = Math.ceil( packSize * 1000 / packNominalVoltage
                                / cellCapacity );

    return [numCellsSeries, numCellsParallel];
}

/**
 * Calculate Pack Resistance
 * @returns {number} pack resistance in mOhm
 */
export function packResitance(){
    let tabR = parseFloat(document
        .querySelector('input[data-drupal-selector = "edit-cell-tab-resistance"]').value);
    let internalR = parseFloat(document.querySelector('input[data-drupal-selector = "edit-cell-internal-resistance"]')
    .value);

    let EEInternR = parseFloat(
        document.querySelector('input[data-drupal-selector = "edit-ee-internal-resistance"]')
        .value);
    let packSize = parseFloat(document.getElementById('edit-pack-size').value);
 
    let [S, P] = [...packSP(packSize)];
    
    return ((tabR + internalR) * S) / P + EEInternR;

}
/**
 * Calculates energy consumption over the cycle
 * with regenerative braking
 * @param {array} speeds
 * @param {boolean} regen
 * @param {string } curr curr = 'cont'  for continuous or 'peak' for peak 
 * @returns {array} energy with regen
 */
export function cycle_energy(speeds, curr = 'cont', regenStatus, regenValue,){
    let regenFactor = regenStatus? regenValue : 0;

    let power = motorPwrActual(speeds, curr);

    let sum = 0 ;
    return power.map((sum = 0, n =>  sum += n  / 3600
                                    * ( 1 * ( n > 0 || (regenStatus && !!regenFactor) ))
                                    * ( ( regenFactor ) / 100 * ( n < 0 ) || 1)  
                                    )) ;
}
/**
 * 
 */
export function plotPowerLimit(id, curr, data){
    let traces = document.getElementById(id).data;

    if (traces.map(v=>v.name).indexOf('Max Power Lim ' + curr)>-1) return;
    if (traces.map(v=>v.name).indexOf('Min Power Lim ' + curr)>-1) return;

    let motorPwr = totalMotorPower( curr );
    
    Plotly.addTraces(id, {
        name:'Max Power Lim '+ curr,
        type: 'scatter', 
        showlegend: false,
        x: data.labels, 
        y: data.labels.map( v => motorPwr ),
        hovertemplate: '%{x:f}s<br>%{y:.2f}<i>kW</i>',
        mode : 'lines',
        xaxis: 'x',
        yaxis: 'y2',
        line : {
            color: 'rgb(0, 0, 0)',
            shape: 'linear', 
            width: 1,
            dash: "dash",
            },
        fill: curr == 'cont' ? 'tozeroy' : 'tonexty',
        fillcolor: curr == 'cont' ? '#95cf9599' : '#ffbf8699',
    });
    Plotly.addTraces(id, {
        name:'Min Power Lim ' + curr,
        type: 'scatter',
        showlegend: false,
        x: data.labels, 
        y: data.labels.map( v=>-motorPwr ),
        mode : 'lines',
        xaxis: 'x',
        yaxis: 'y2',
        line : {
            color: 'rgb(0, 0, 0)',
            shape: 'linear', 
            width: 1,
            dash : "dash",
            },
        fill: curr == 'cont' ? 'tozeroy' : 'tonexty',
        fillcolor: curr == 'cont' ? '#95cf9599' : '#ffbf8699',
    });
}

/**
 * generic Plot function
 * @param { object } traceObj  
 * @returns 
 */
export function plotTrace(containerId, traceObject, data){
    let traces = document.getElementById(containerId).data;
    let regenValue = document.getElementById('edit-useable-capacity');
    
    if (traces.map(v=>v.name).indexOf(traceObject.traceName) > -1) return;

    let yValues = traceObject.dataCallback(data.speeds, traceObject.curr, traceObject.regen == 'on', regenValue);

    Plotly.addTraces(containerId, {
        name: traceObject.traceName,
        type: 'scatter',
        x: data.labels,
        y: yValues,
        xaxis: traceObject.xaxis,
        yaxis: traceObject.yaxis,
        hovertemplate: traceObject.hovertemplate,
        mode : 'lines',
        line : {
            color: traceObject.line.color,
            shape: 'spline', 
            smoothing: 1.3,
            width: 1,
            },
        marker : traceObject.marker,
        visible: traceObject.visible,
        fill: traceObject.fill,
        fillColor: traceObject.fillColor,
    });
}

/**
 * calculate battery pack size in kWh
 */
export function calculateBatteryPackSize(speeds){

    let range = document.getElementById('edit-vehicle-range').value;
    let useable_capacity = document.getElementById('edit-useable-capacity').value;
    let ancillaryLoadEnergy = document.getElementById('edit-ancillary-energy').value;
    let powertrainEfficiency = document.getElementById('edit-powertrain-efficiency').value;
    let regenFactor = document.getElementById('edit-regen-capacity').value;
    let cycleEnergy = cycle_energy(speeds, 'peak', true, regenFactor);
    let selectedCycle = document.getElementById('edit-cycle-select').value;
    
    // vehicle efficiency [wh/km]
    let efficiency = (( cycleEnergy.slice(-1)[0] * 1000
                    / ( cycleDistance(speeds) / 1000 ) + ancillaryLoadEnergy )
                    / powertrainEfficiency).toFixed(1);

    let efficiency2 = ( 1000 / efficiency / 1.609 ).toFixed(2);
    let range_mi = ( range / 1.609 ).toFixed(0);
    let batterySize = ( efficiency * range / ( useable_capacity / 100) / 1000 ).toFixed(1);

    document.getElementById('results').innerHTML = `<p class="lead">The energy requirement of this
                             vehicle is ${efficiency}Wh/km or ${efficiency2}mi/kWh.
                            To achieve a range of ${range}km or ${range_mi}miles on 
                            ${selectedCycle} cycle this vehicle requires a battery of 
                            ${batterySize}kWh 
                            if ${useable_capacity}% of the battery capacity is useable.<p>`;                    
}

/**
 * Callback function to update plot of vehicle speed (using Plotly library)
 * @param {object} data - an array of arrays of plot data 
 */
export function updatePlotly(){
    
    let data = {};
    [ data.labels, data.speeds ] = [ ...getData() ];

    let plots = document.getElementsByClassName( 'js-plotly-plot' );
    let xMidPoint = (data.speeds).length / 2; //xaxis mid point
    if (plots) { //if there are any plots, clear them
        for ( let p of plots ) {
            Plotly.purge(p);
        }
    }
    
    let totalPeakMotorPower = totalMotorPower( 'peak' );
    let totalContMotorPower = totalMotorPower( 'cont' );

    let layout = {
        layout_cycle_preview : {
            title: 'Speed Profile',
            showlegend: false,
            height: 450,
            xaxis: {
                domain: [0.0, 1],
                title: 'time [s]',
                tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                tick0: 0,
                dtick: 500,
                anchor: 'y',
                showspikes: true,
                rangeslider: {},
                },
            yaxis: {
                title: 'speed [km/h]',
                tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                tick0: 0,
                dtick: 20,
                titlefont: {color: 'black'},
                tickfont: {color: '#black'},
                anchor: 'x',
                showspikes: true,
            },            
            autosize: true,
            automargin: false,
            paper_bgcolor: '#fcf2d7',// DaVinci paper color
            plot_bgcolor: '#faebd7', //Antique white
            modebar: {
                add: [
                    "v1hovermode",
                    "hoverclosest", 
                    "hovercompare", 
                    "togglehover", 
                    "togglespikelines",
                //   "drawline", "drawopenpath", "drawclosedpath", "drawcircle", "drawrect", "eraseshape"
            ]
            },
        },
        layout_vehicle : {
            title: 'Vehicle Power and Energy',
            xaxis: {
                rangemode: 'tozero',
                zeroline: true,
                showline: true,
                domain: [0.0, 1.0],
                title: {
                    text: 'time [s]',
                    standoff: 0,
                },
                tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                mirror: 'ticks',
                tick0: 0,
                dtick: 500,
                nticks: 4,
                ticks: 'inside',
                ticklen: 10,
                tickcolor: 'black',
                minor: {
                    ticks: 'inside',
                    ticklen: 6,
                    tickcolor: 'black'
                  },
                anchor: 'y',
                showspikes: true,
                },
            yaxis: {
                title: 'Speed [km/h]',
                domain: [ 0.52, 1.0 ],
                tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                tick0: 0,
                dtick: 20,
                titlefont: {color: 'black'},
                tickfont: {color: '#black'},
                anchor: 'x',
                showspikes: true,
            },            
            autosize: true,
            automargin: false,
            paper_bgcolor: '#fcf2d7',// DaVinci paper color
            plot_bgcolor: '#faebd7', //Antique white
            modebar: {
                add: [
                    "v1hovermode",
                    "hoverclosest", 
                    "hovercompare", 
                    "togglehover", 
                    "togglespikelines",
                //   "drawline", "drawopenpath", "drawclosedpath", "drawcircle", "drawrect", "eraseshape"
            ]
            },
            xaxis2: {
                title: 'time [s]',
                showline: true,
                tick0: 0,
                dtick: 500,
                nticks: 4,
                ticks: 'inside',
                ticklen: 10,
                tickcolor: 'black',
                minor: {
                    ticks: 'inside',
                    ticklen: 6,
                    tickcolor: 'black'
                  },
                anchor: 'y2',
                domain: [0, 1],
                showspikes: true,
            },
            yaxis2: {
                title: 'Power [kW]',
                titlefont: {color: 'rgb(148, 103, 189)'},
                tickfont: {color: 'rgb(148, 103, 189)'},
                anchor: 'x',
                side: 'left',
                domain: [0, 0.48],
                showspikes: true,
            },
            yaxis3: {
                title: 'Energy [kWh]',
                titlefont: {color: '#d62728'},
                tickfont: {color: '#d62728'},
                anchor: 'x',
                overlaying: 'y',
                side: 'right',
                position: 1,
            },
            yaxis4: {
                title: 'Motor_Torque [Nm]',
                titlefont: {color: 'rgb(55, 128, 191)'},
                tickfont: {color: 'rgb(55, 128, 191)'},
                anchor: 'x',
                overlaying: 'y2',
                side: 'right',
                domain: [0, 0.48],
                position: 1,
            },
            showlegend: true,
            height: 860,
            legend: {
                x: 0,
                y: 1.05,
                yanchor:"top",
                xanchor: "left",
                orientation: 'h',
                traceorder: 'reversed',
                font: {
                    family: 'sans-serif',
                    size: 12,
                    color: '#000'
                },
                bgcolor: '#E2E2E2',
                // bordercolor: '#FFFFFF',
                // borderwidth: 2,   
                yref: 'paper',
            },
            // colorway : ['#f3cec9', '#e7a4b6', '#cd7eaf', '#a262a9', '#6f4d96', '#3d3b72', '#182844'],
            colorway: ["red", "green", "blue", "goldenrod", "magenta"],
            annotations: [
                {
                    x: xMidPoint,
                    y: totalPeakMotorPower - 5,
                    xref: 'x',
                    yref: 'y2',
                    text: 'Max Motor Peak Power',
                    showarrow: false,
                },
                {
                    x: xMidPoint,
                    y: -totalPeakMotorPower + 5,
                    xref: 'x',
                    yref: 'y2',
                    text: 'Min Motor Peak Power',
                    showarrow: false,
                },
                {
                    x: xMidPoint,
                    y: totalContMotorPower + 5,
                    xref: 'x',
                    yref: 'y2',
                    text: 'Max Motor Continuous Power',
                    showarrow: false,
                },
                {
                    x: xMidPoint,
                    y: -totalContMotorPower - 5,
                    xref: 'x',
                    yref: 'y2',
                    text: 'Min Motor Continuous Power',
                    showarrow: false,
                }
            ],
        },
        layout_battery : {
            title: 'Battery Electrical Loads',
            // xref:'paper',
            xaxis: {
                title: {
                    domain: [0, 0.85],
                    text: 'time [s]',
                    standoff: 5,
                },
                tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                tick0: 0,
                dtick: 500,
                anchor: 'y',
                showspikes: true,
                },
            yaxis: {
                title: 'Speed [km/h]',
                domain: [ 0.5, 1 ],
                tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                tick0: 0,
                dtick: 20,
                titlefont: {color: 'black'},
                tickfont: {color: '#black'},
                anchor: 'x',
                showspikes: true,
            },            
            autosize: true,
            automargin: false,
            paper_bgcolor: '#fcf2d7',// DaVinci paper color
            plot_bgcolor: '#faebd7', //Antique white
            modebar: {
                add: [
                    "v1hovermode",
                    "hoverclosest", 
                    "hovercompare", 
                    "togglehover", 
                    "togglespikelines",
                //   "drawline", "drawopenpath", "drawclosedpath", "drawcircle", "drawrect", "eraseshape"
            ]
            },
            xaxis2: {
                domain: [ 0, 0.85 ],
                title: 'time [s]',
                anchor: 'y2',
                categoryorder: 'array',
                showspikes: true,
            },
            yaxis2: {
                title: 'Power [kW]',
                titlefont: {color: 'rgb(148, 103, 189)'},
                tickfont: {color: 'rgb(148, 103, 189)'},
                anchor: 'x',
                side: 'left',
                domain: [0, 0.48],
                showspikes: true,
            },
            yaxis3: {
                title: 'Energy [kWh]',
                titlefont: {color: '#d62728'},
                tickfont: {color: '#d62728'},
                anchor: 'x',
                overlaying: 'y',
                side: 'right',
                position: 1,
            },
            yaxis4: {
                title: 'Current [A]',
                titlefont: {color: 'blue'},
                tickfont: {color: 'blue'},
                anchor: 'free',
                overlaying: 'y2',
                side: 'left',
                domain: [0, 0.48],
                position: 0,
            },
            yaxis5:{
                title: 'SOC [%]',
                titlefont: {color: 'rgb(55, 128, 191)'},
                tickfont: {color: 'rgb(55, 128, 191)'},
                anchor: 'free',
                overlaying: 'y',
                side: 'right',
                position: 0.9,
            },
            height: 860,
            showlegend: true,
            legend: {
                y: 1.05,
                yanchor:"top",
                xanchor: "left",
                orientation: 'h',
                traceorder: 'reversed',
                font: {
                    family: 'sans-serif',
                    size: 12,
                    color: '#000'
                },
                bgcolor: '#E2E2E2',
                // bordercolor: '#FFFFFF',
                // borderwidth: 1,
            },
            // colorway : ['#f3cec9', '#e7a4b6', '#cd7eaf', '#a262a9', '#6f4d96', '#3d3b72', '#182844'],
            colorway: ["red", "green", "blue", "goldenrod", "magenta"],
        }
    }

    calculateSpeedInfo(data.speeds);
    calculateBatteryPackSize(data.speeds);

    const speed1 = {
        x: data.labels,
        y: data.speeds.map(v => v * 3.6),
        hovertemplate: '%{x:d}s<br>%{y:.1f}<i>km/h</i>',
        name : 'Speed',
        type : 'scatter',
        mode : 'lines',
        line : {
            color:'black',
            shape: 'linear',
            width: 1,
            },
    };

    // copy object without reference, 
    const speed2 = JSON.parse(JSON.stringify(speed1));

    speed2.mode = 'lines+markers'
    speed2.marker = {};
    speed2.marker.size = 3;
    speed2.marker.color = data.speeds;
    speed2.legendgroup = 'group2';

    let fullscreenIcon = {
        'width': 512,
        'height': 512,
        'path': "M512 512v-208l-80 80-96-96-48 48 96 96-80 80z M512 0h-208l80 80-96 96 48 48 96-96 80 80z M0 512h208l-80-80 96-96-48-48-96 96-80-80z M0 0v208l80-80 96 96 48-48-96-96 80-80z"
      }
    const config = {
        scrollZoom: true,
        responsive: true,
        editable: false,
        modeBarButtonsToAdd: [{
            name: 'Fullscreen',
            icon: fullscreenIcon,
            click: function(gd) {
                gd.classList.toggle('fullscreen');
            //   Plotly.Plots.resize(gd);
            Plotly.relayout(gd, {autosize:true})
            }
          }]
    }
    
    let speedPlots = {
        'speedPlotPreview':{
            'traces': [speed2],
            'layout': layout.layout_cycle_preview,
        },
        'speedPlotPackSize':{
            'traces': [speed1],
            'layout': layout.layout_vehicle,
        },
        'speedPlotPackSpec':{
            'traces': [speed1],
            'layout': layout.layout_battery,
        },
    };

    Object.keys(speedPlots).forEach(key => {
        Plotly.newPlot(key,
                        speedPlots[key].traces,
                        speedPlots[key].layout,
                        config
                        );
    });

    let containerLayout = {
        'speedPlotPackSize': [
            'EnergyRegenOn',
            'EnergyRegenOff',
            'PowerDemand',
            'MotorTorqueDmnd',
            'MotorPower',
        ],
        'speedPlotPackSpec' : [
            'SOC',
            'Current',
            'EnergyWithoutRegen',
            'EnergyWithRegen',
        ]
    }

    let traceObj = {
        'EnergyRegenOn':
        {
            traceName: "Energy On",
            curr: "peak", // 'cont' or 'peak',
            dataCallback: cycle_energy, // function name to generate y axis data.
            xaxis: 'x',
            yaxis: "y3", // y2, y3, etc.
            hovertemplate: "%{x:f}s<br>%{y:.2f}<i>kWh</i>",
            line:{
                color: "green",
            },
            marker : {
                mode : "",
                size : "",
                color : "",
            },
            visible: true,
            regen: "on",
            fill: "", // curr == 'cont' ? 'tozeroy' : 'tonexty',
            fillColor:"", // curr == 'cont' ? '#95CF95' : '#FFBF86',
        },
        'EnergyRegenOff':
        {
            traceName: "Energy Off",
            curr: "peak", // 'cont' or 'peak',
            dataCallback: cycle_energy, // function name to generate y axis data.
            xaxis: 'x',
            yaxis: "y3", // y2, y3, etc.
            hovertemplate: "%{x:f}s<br>%{y:.2f}<i>kWh</i>",
            line:{
                color: 'red',
            },
            marker : {
                mode : "",
                size : 0,
                color : "",
            },
            visible: true,
            regen: "off", //'on' or 'off
            fill: "", // curr == 'cont' ? 'tozeroy' : 'tonexty',
            fillColor:"", // curr == 'cont' ? '#95CF95' : '#FFBF86',
        },
        'EnergyWithRegen':
        {
            traceName: "Energy w/ Regen",
            curr: "peak", // 'cont' or 'peak',
            data: data, // object containing speed and labels
            dataCallback: cycle_energy, // function name to generate y axis data.
            xaxis: 'x',
            yaxis: "y3", // y2, y3, etc.
            hovertemplate: "%{x:f}s<br>%{y:.2f}<i>kWh</i>",
            line:{
                color: "green",
            },
            marker : {
                mode : "",
                size : 0,
                color : "green",
            },
            visible: true,
            regen: "on",
            fill: "", // curr == 'cont' ? 'tozeroy' : 'tonexty',
            fillColor:"", // curr == 'cont' ? '#95CF95' : '#FFBF86',
        },
        'EnergyWithoutRegen':
        {
            traceName: "Energy w/o Regen",
            curr: "peak", // 'cont' or 'peak',
            dataCallback: cycle_energy, // function name to generate y axis data.
            xaxis: 'x',
            yaxis: "y3", // y2, y3, etc.
            hovertemplate: "%{x:f}s<br>%{y:.2f}<i>kWh</i>",
            line:{
                color:"red",
            },
            marker : {
                mode : "",
                size : 0,
                color : "red",
            },
            visible: true,
            regen: "off", //'on' or 'off
            fill: "", // curr == 'cont' ? 'tozeroy' : 'tonexty',
            fillColor:"", // curr == 'cont' ? '#95CF95' : '#FFBF86',
        },
        'MotorPower':
        {
            traceName: "Motor Power",
            curr: "peak", // 'cont' or 'peak',
            dataCallback: motorPwrActual, // function name to generate y axis data.
            showlegend: false,
            xaxis: "x",
            yaxis: "y2", // y2, y3, etc.
            hovertemplate: '%{x:f}s<br>%{y:.2f}<i>kW</i>',
            line:{
                color:"",
            },
            marker : {
                mode : "",
                size : 0,
                color : "",
            },            
            visible: true,
            regen: null, //'on' or 'off
            fill: "", // curr == 'cont' ? 'tozeroy' : 'tonexty',
            fillColor:"", // curr == 'cont' ? '#95CF95' : '#FFBF86',
        },
        'MaxPwrLimPeak':
        {
            traceName: "Max Power Limit Peak",
            curr: "peak", // 'cont' or 'peak',
            dataCallback: totalMotorPower, // function name to generate y axis data.
            showlegend: false,
            xaxis: "x",
            yaxis: "y2", // y2, y3, etc.
            line:{
                color:"rgb(0, 0, 0)",
            },
            marker : {
                mode : "",
                size : 0,
                color : "",
            },            
            visible: true,
            regen: null, // null, 'on' or 'off
            fill: this.type == 'cont' ? 'tozeroy' : 'tonexty',
            fillColor: this.type == 'cont' ? '#95CF95' : '#FFBF86',
        },
        'MinPwrLimPeak':
        {
            traceName: "Min Power Limit Peak",
            curr: "peak", // 'cont' or 'peak',
            dataCallback: totalMotorPower, // function name to generate y axis data.
            xaxis: "x",
            yaxis: "y2", // y2, y3, etc.
            line:{
                color:"rgb(0, 0, 0)",
            },
            marker : {
                mode : "",
                size : 0,
                color : "",
            },            
            visible: 'legendonly',
            regen: null, //'on' or 'off
            fill: this.curr == 'cont' ? 'tozeroy' : 'tonexty',
            fillColor: this.curr == 'cont' ? '#95CF95' : '#FFBF86',
        },
        'MaxPwrLimCont':
        {
            traceName: "Max Power Limit Continuous",
            curr: "cont", // 'cont' or 'peak',
            dataCallback: totalMotorPower, // function name to generate y axis data.
            showlegend: false,
            xaxis: "x",
            yaxis: "y2", // y2, y3, etc.
            line:{
                color:"rgb(0, 0, 0)",
            },
            marker : {
                mode : "",
                size : 0,
                color : "",
            },            
            visible: 'legendonly',
            regen: null, // null, 'on' or 'off
            fill: this.type == 'cont' ? 'tozeroy' : 'tonexty',
            fillColor: this.type == 'cont' ? '#95CF95' : '#FFBF86',
        },
        'MinPwrLimCont':
        {
            traceName: "Min Power Limit Continuous",
            curr: "cont", // 'cont' or 'peak',
            dataCallback: totalMotorPower, // function name to generate y axis data.
            xaxis: "x",
            yaxis: "y2", // y2, y3, etc.
            line:{
                color:"9467bd",
            },
            marker : {
                mode : "lines+markers",
                size : 3,
                color : "#9467bd",
            },
            visible: 'legendonly',
            regen: null, //'on' or 'off
            fill: this.curr == 'cont' ? 'tozeroy' : 'tonexty',
            fillColor: this.curr == 'cont' ? '#95CF95' : '#FFBF86',
        },
        'MotorTorqueDmnd':
        {
            traceName: "Motor Torque Dmnd",
            curr: null, // 'cont' or 'peak',
            dataCallback: motorTrqDmnd, // function name to generate y axis data.
            xaxis: "x", 
            yaxis: "y4", // y2, y3, etc.
            hovertemplate: '%{x:f}s<br>%{y:.2f}<i>Nm</i>',
            line:{
                color:"rgb(55, 128, 191)",
            },
            marker : {
                mode : 'lines+markers',
                size : 3,
                color : '#9467bd',
            },
            visible: 'legendonly',
            regen: null, //'on' or 'off
            fill: "", // curr == 'cont' ? 'tozeroy' : 'tonexty',
            fillColor:"", // curr == 'cont' ? '#95CF95' : '#FFBF86',
        },
        'PowerDemand':
        {
            traceName: "Power Demand",
            curr: null, // 'cont' or 'peak',
            dataCallback: total_cycle_power, // function name to generate y axis data.
            xaxis: "x",
            yaxis: "y2", // y2, y3, etc.
            hovertemplate: '%{x:f}s<br>%{y:.2f}<i>kW</i>',
            line:{
                color: '#9467bd', // rgb(128,128,128) or #8AC007,
            },
            marker : {
                mode : 'lines+markers',
                size : 3,
                color : '#9467bd',
            },
            visible: true,
            regen: null, //'on' or 'off
            fill: "", // curr == 'cont' ? 'tozeroy' : 'tonexty',
            fillColor:"", // curr == 'cont' ? '#95CF95' : '#FFBF86',
        },
        'SOC':{
            traceName: "SOC",
            curr: null, // 'cont' or 'peak',
            dataCallback: SOC, // function name to generate y axis data.
            xaxis: "x",
            yaxis: "y5", // y2, y3, etc.
            hovertemplate: '%{x:f}s<br>%{y:.2f}<i>%</i>',
            line:{
                color: "rgb(55, 128, 191)", // rgb(128,128,128) or #8AC007,
            },
            marker : {
                mode : "",
                size : 0,
                color : "",
            },
            visible: true,
            regen: null, //'on' or 'off
            fill: "", // curr == 'cont' ? 'tozeroy' : 'tonexty',
            fillColor:"", // curr == 'cont' ? '#95CF95' : '#FFBF86',
        },
        'Current':{
            traceName: "Current",
            curr: 'peak',
            dataCallback: currentActual,
            xaxis: "x",
            yaxis: "y4",
            hovertemplate: '%{x}s<br>%{y:.2f}<i>A</i>',
            line : {
                color: 'blue'
                },
            marker: {
                mode: "",
                size: 0,
                color: "",
            },
            visible: true,
            regen: null,
            fill: "",
            fillColor: "",
        },
        }

    plotPowerLimit('speedPlotPackSize', 'peak', data);
    plotPowerLimit('speedPlotPackSize', 'cont', data);

    Object.keys(containerLayout).forEach(key=>{
        containerLayout[key].forEach(trace=>{
            plotTrace(key, traceObj[trace], data);
        })
    });
}   