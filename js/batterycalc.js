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

export function totalMotorPower(curr = 'cont'){
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
 * Calculates SOC from current of continuous power from motor
 * @param {array} speeds 
 * @returns {array} soc
 */
export function SOC(speeds, curr){
    let E = 1e3*document.getElementById("pack_energy_container").value;
    let V = document.getElementById('edit-voltage-architecture-0').checked? 400 : 800;

    let C = E/V;

    let current=currentActual(speeds, curr);
    let soc = 100;
    
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

    let R = 0.1; // pack resistance

    return actualPwr.map(p => (V - Math.sqrt(V * V - 4 * R * p * 1000)) / 2 / R )
}

/**
 * Calculates energy consumption over the cycle
 * with regenerative braking
 * @param {array} speeds
 * @param {boolean} regen
 * @param {string } curr curr = 'cont'  for continuous or 'peak' for peak 
 * @returns {array} energy with regen
 */
export function cycle_energy(speeds, regen_status, regen_value, curr = 'cont'){
    let regen_factor = regen_status? regen_value : 0;

    let power = motorPwrActual(speeds, curr);

    let sum = 0 ;
    return power.map((sum = 0, n =>  sum += n  / 3600
                                    * ( 1 * ( n > 0 || (regen_status && !!regen_factor) ))
                                    * ( ( regen_factor ) / 100 * ( n < 0 ) || 1)  
                                    )) ;
}

/**
 * Add SOC trace to plot
 * @param {object} e, event object
 * @param {string} id
 * @returns 
 */
export function plotSOCActual(id, curr, data){
    // e.preventDefault();
    let traces = document.getElementById(id).data

    let trace_name = 'SOC Cont';

    if (curr == 'peak') trace_name = 'SOC Peak';

    if (traces.map(v=>v.name).indexOf(trace_name) > -1) return;

    let soc = SOC(data.speeds, curr);

    Plotly.addTraces(id, {
        name: trace_name,
        type: 'scatter', 
        x: data.labels, 
        y: soc,
        hovertemplate: '%{x:f}s<br>%{y:.2f}<i>%</i>',
        xaxis: 'x',
        yaxis: 'y5',
        mode : 'lines',
        line : {
            color: 'rgb(55, 128, 191)',
            shape: 'spline', 
            smoothing: 1.3,
            width: 1,
            },
    });
}

/**
 * Add continuous current trace to plot
 * @param {object} e, event object
 * @param {string} id
 * @returns 
 */
export function plotCurrentActual(id, curr = 'cont', data, e){
    // e.preventDefault();
    let traces = document.getElementById(id).data
    let trace_name = 'Current Cont';

    if (curr == 'peak'){
        trace_name = 'Current Peak';
    }
    
    if (traces.map(v=>v.name).indexOf(trace_name)>-1) return;

    let current = currentActual(data.speeds, curr);

    Plotly.addTraces(id, {
        name: trace_name,
        type: 'scatter', 
        x: data.labels, 
        y: current,
        hovertemplate: '%{x:f}s<br>%{y:.2f}<i>A</i>',
        xaxis: 'x',
        yaxis: 'y4',
        mode : 'lines',
        line : {
            shape: 'spline', 
            smoothing: 1.3,
            width: 1,
            },
    });
}

/**
 * Add energy consumption with regen 
 * @param {object} e, event object
 * @param {string} id
 * @param {string} regen, 'on' if regen taken into account, else 'off'
 * @returns 
 */
export function plotCycleEnergy(id, regen='off', trace_name, curr, data, e){
    // e.preventDefault();
    let traces = document.getElementById(id).data;
    let regen_value = 0;
    if (regen == 'on') {
        regen_value = document.getElementById('edit-regen-capacity').value
    }

    // don't replot trace if already plotted
    // if (traces && traces.map(v=>v.name).indexOf(trace_name)>-1) return;

    let energy = cycle_energy( data.speeds, regen == 'on', regen_value, curr );

    Plotly.addTraces(id, {
        name: trace_name,
        type: 'scatter', 
        x: data.labels, 
        y: energy,
        hovertemplate: '%{x:f}s<br>%{y:.2f}<i>kWh</i>',
        xaxis: 'x',
        yaxis: 'y3',
        mode : 'lines',
        line : {
            color: regen == 'on'? 'green': 'red',
            shape: 'spline', 
            smoothing: 1.3,
            width: 1,
            },
    });
}

/**
 * 
 * @param {object} e 
 * @returns 
 */
export function plotPwrDmnd(id, data, e){
    // e.preventDefault();
     let traces = document.getElementById(id).data

    if (traces.map(v=>v.name).indexOf('Power Demand')>-1) return;

    let power = total_cycle_power( data.speeds );

    Plotly.addTraces(id, {
        name:'Power Demand',
        type: 'scatter', 
        x: data.labels, 
        y: power,
        hovertemplate: '%{x:f}s<br>%{y:.2f}<i>kW</i>',
        xaxis: 'x',
        yaxis: 'y2',
        mode : 'lines',
        line : {
            color: '#9467bd',
            shape: 'spline', 
            smoothing: 1.3,
            width: 1,
            },
        marker : {
            mode : 'lines+markers',
            size : 3,
            color : '#9467bd',
        }
    });
}

/**
 * Add SOC trace to plot
 * @param {object} e, event object
 * @param {string} id
 * @returns 
 */
export function plotMotorTrqDmnd(id, data){
    // e.preventDefault();
    let traces = document.getElementById(id).data

    let trace_name = 'Motor Torque Dmnd [Nm]';

    if (traces.map(v=>v.name).indexOf(trace_name) > -1) return;

    let motorTrq = motorTrqDmnd(data.speeds);

    Plotly.addTraces(id, {
        name: trace_name,
        type: 'scatter', 
        x: data.labels, 
        y: motorTrq,
        hovertemplate: '%{x:f}s<br>%{y:.2f}<i>Nm</i>',
        xaxis: 'x',
        yaxis: 'y4',
        mode : 'lines',
        line : {
            color: 'rgb(55, 128, 191)',
            shape: 'spline', 
            smoothing: 1.3,
            width: 1,
            },
        visible: 'legendonly',
    });
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
            },
        fill: curr == 'cont' ? 'tozeroy' : 'tonexty',
        fillcolor: curr == 'cont' ? '#95CF95' : '#FFBF86',
    });
    Plotly.addTraces(id, {
        name:'Min Power Lim ' + curr,
        type: 'scatter', 
        x: data.labels, 
        y: data.labels.map(v=>-motorPwr),
        mode : 'lines',
        xaxis: 'x',
        yaxis: 'y2',
        line : {
            color: 'rgb(0, 0, 0)',
            shape: 'linear', 
            width: 1,
            },
        fill: curr == 'cont' ? 'tozeroy' : 'tonexty',
        fillcolor: curr == 'cont' ? '#95CF95' : '#FFBF86',
    });
}

/**
 * 
 * @param {object} e 
 * @returns 
 */
export function plotPwrActual(id, curr, data){
    // e.preventDefault();
    
    let traces = document.getElementById(id).data;

    let trace_name = (curr == 'peak')? 'Motor Power Peak' :'Motor Power Continuous';

    if (traces.map(v=>v.name).indexOf(trace_name)>-1) return;

    let actualPwr = motorPwrActual( data.speeds, curr );

    Plotly.addTraces(id, {
        name: trace_name,
        type: 'scatter', 
        x: data.labels, 
        y: actualPwr,
        hovertemplate: '%{x:f}s<br>%{y:.2f}<i>kW</i>',
        mode : 'lines',
        xaxis: 'x',
        yaxis: 'y2',
        line : {
            shape: 'spline', 
            smoothing: 1.3,
            width: 1,
            },
    });
}

/**
 * Callback function to update plot of vehicle speed (using Plotly library)
 * @param {object} data - an array of arrays of plot data 
 */
export function updatePlotly(){

    let data = {};
    [data.labels, data.speeds] = [...getData()];

    let plots = document.getElementsByClassName('js-plotly-plot');
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
            xaxis: {
                title: 'time [s]',
                tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                tick0: 0,
                dtick: 500,
                anchor: 'y',
                rangeslider: {},
                domain: [0, 1],
                showspikes: true,
                },
            yaxis: {
                title: 'speed [km/h]',
                tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                tick0: 0,
                dtick: 20,
                titlefont: {color: 'black'},
                tickfont: {color: '#black'},
                anchor: 'x',
                domain: [0, 1],
                showspikes: true,
            },
            showlegend: false,
            autosize: true,
            height: 450,
            automargin: false,
            paper_bgcolor: '#fcf2d7',// DaVinci paper color
            plot_bgcolor: '#faebd7', //Antique white
        },
        layout_vehicle : {
            title: 'Vehicle Power and Energy',
            xaxis: {
                domain: [0.0, 1],
                tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                tick0: 0,
                dtick: 500,
                anchor: 'y',
                showspikes: true,
                },
            xaxis2: {
                domain: [0.0, 0.8],
                title: 'time [s]',
                anchor: 'y2',
                categoryorder: 'array',
                domain: [0, 1],
                showspikes: true,
            },
            yaxis: {
                title: 'speed [km/h]',
                tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                tick0: 0,
                dtick: 20,
                titlefont: {color: 'black'},
                tickfont: {color: '#black'},
                anchor: 'x',
                domain: [0.52, 1],
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
                titlefont: {color: '#d62728'},
                tickfont: {color: '#d62728'},
                anchor: 'x',
                overlaying: 'y2',
                side: 'right',
                domain: [0, 0.48],
                position: 1,
            },
            showlegend: true,
            autosize: true,
            height: 860,
            automargin: false,
            legend: {
                y: 0,
                orientation: 'h',
                traceorder: 'reversed',
                font: {size: 16},
                yref: 'paper',
            },
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
            // colorway : ['#f3cec9', '#e7a4b6', '#cd7eaf', '#a262a9', '#6f4d96', '#3d3b72', '#182844'],
            colorway: ["red", "green", "blue", "goldenrod", "magenta"],
            annotations: [
                {
                    x: xMidPoint,
                    y: totalPeakMotorPower + 5,
                    xref: 'x',
                    yref: 'y2',
                    text: 'Max Motor Peak Power',
                    showarrow: false,
                },
                {
                    x: xMidPoint,
                    y: -totalPeakMotorPower - 5,
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
            xref:'paper',
            xaxis: {
                domain: [0.0, 0.9],
                tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                tick0: 0,
                dtick: 500,
                anchor: 'y',
                showspikes: true,
                },
            xaxis2: {
                domain: [0.0, 0.8],
                title: 'time [s]',
                anchor: 'y2',
                categoryorder: 'array',
                domain: [0, 1],
                showspikes: true,
            },
            yaxis: {
                title: 'speed [km/h]',
                tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                tick0: 0,
                dtick: 20,
                titlefont: {color: 'black'},
                tickfont: {color: '#black'},
                anchor: 'x',
                domain: [0.52, 1],
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
                titlefont: {color: '#d62728'},
                tickfont: {color: '#d62728'},
                anchor: 'x',
                overlaying: 'y2',
                side: 'right',
                domain: [0, 0.48],
                position: 1,
            },
            yaxis5:{
                title: 'SOC [%]',
                titlefont: {color: 'rgb(55, 128, 191)'},
                tickfont: {color: 'rgb(55, 128, 191)'},
                anchor: 'x',
                overlaying: 'y',
                side: 'right',
                position: 0.9,
            },
            showlegend: true,
            autosize: true,
            height: 860,
            automargin: false,
            legend: {
                y: 0,
                orientation: 'h',
                traceorder: 'reversed',
                font: {size: 16},
                yref: 'paper',
            },
            paper_bgcolor: '#fcf2d7',// DaVinci paper color
            plot_bgcolor: '#faebd7', //Antique white
            modebar: {
                add: ["v1hovermode",
                "hoverclosest", 
                "hovercompare", 
                "togglehover", 
                "togglespikelines",
                //   "drawline", "drawopenpath", "drawclosedpath", "drawcircle", "drawrect", "eraseshape"
            ]
            },
            // colorway : ['#f3cec9', '#e7a4b6', '#cd7eaf', '#a262a9', '#6f4d96', '#3d3b72', '#182844'],
            colorway: ["red", "green", "blue", "goldenrod", "magenta"],
        }
    }

    calculateSpeedInfo(data.speeds);

    const speed1 = {
        x: data.labels,
        y: data.speeds.map(v => v * 3.6),
        hovertemplate: '%{x:f}s<br>%{y:.2f}<i>km/h</i>',
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

    let icon1 = {
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
            icon: icon1,
            click: function(gd) {
                console.log(gd);
                gd.classList.toggle('fullscreen');
              Plotly.Plots.resize(gd);
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

    plotPowerLimit('speedPlotPackSize', 'peak', data);
    plotPowerLimit('speedPlotPackSize', 'cont', data);
    plotPwrActual('speedPlotPackSize', 'peak', data);
    plotMotorTrqDmnd('speedPlotPackSize', data);
    plotPwrDmnd('speedPlotPackSize', data);
    plotCycleEnergy('speedPlotPackSize', 'on', 'Energy regen on', 'peak', data);
    plotCycleEnergy('speedPlotPackSize', 'off', 'Energy regen off', 'peak', data);
    plotCycleEnergy('speedPlotPackSpec', 'on', 'Energy w/ regen', 'cont',data);
    plotCycleEnergy('speedPlotPackSpec', 'off', 'Energy w/o regen', 'cont',data);
    plotCurrentActual('speedPlotPackSpec', 'cont',data);
    plotCurrentActual('speedPlotPackSpec', 'peak',data);
    plotSOCActual('speedPlotPackSpec', 'cont',data);
}   