/**totalMotorPower
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
 * generates output text of vehicle speed cycle calculated statistics
 * this function calculates the min, max, average speed of the cycle
 * and the total distance in km.
 * speed cycle is specified in km/h with a sample time of one second.
 * 
 * @param {array} speeds - array of 2 arrays containing labels and
 * and speed data respectively.
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

    let totalDistance = ((speeds.reduce((a, b) => a + b, 0) || 0) );
    let averageSpeed = (totalDistance / speeds.length || 0).toFixed(2) ;

    speedInfo.innerHTML = `<i>This drive cycle has a minimum speed of ${ (3.6 * Math.min(...speeds)).toFixed(2)||0 } km/h, 
                                 a maximum speed of ${ (3.6 * Math.max(...speeds)).toFixed(2)||0 } km/h,
                                 an average speed of ${ (3.6 * averageSpeed).toFixed(2) } km/h, an average acceleration of ${ averageAcceleration } m/s², 
                                 an average deceleration of ${ averageDeceleration } m/s²and 
                                 a total distance of ${ (totalDistance / 1000).toFixed(2) } km</i>`
}

/**
 * Callback function to update plot of vehicle speed (using Plotly library)
 * @param {array} traces - an array of arrays of plot data 
 * @param {object} layout - an object of plot settings
 */
export function updatePlotly(speedPlots, config){

    let [labels, data] = [...getData()];
    let plotData = speedPlots;
    
    calculateSpeedInfo(data);

    let plots = document.getElementsByClassName('js-plotly-plot');

    for( let p of plots )  {
        plotData[p.id].traces[0].x = labels;
        plotData[p.id].traces[0].y = data.map( v =>v * 3.6 );
        Plotly.react(p,
                    [plotData[p.id].traces[0]],
                    plotData[p.id].layout,
                    config )};
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
 * calculate all forces on vehicle asuming sample time of 1s.
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
    let alpha = document.getElementById('edit-road-slope').value;


    return speeds.map((v,i) =>( mass * ((v - (speeds[i-1] || 0) ) 
                                        + GRAVITY * Crr * Math.cos(alpha)
                                        + GRAVITY * Math.sin(alpha))
                                        + 0.5 * rho * Cd * A * v * v ));    
}

/**
 * Calculates the total power demand 
 * from the speed cycle in [kw]
 * @param {array} speeds 
 * @returns {array}
 */
export function total_cycle_power(speeds){
    return total_forces(speeds).map((f, i) => f * speeds[i] / 1000);
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
export function motorPwrActual(speeds, curr = 'cont'){
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
    let V = document.getElementById('edit-voltage-architecture-0').isChecked? 400 : 800;

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
    let V = 800; // pack voltage
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
    if (arguments.length === 2) regen_value = 0;
    let power = motorPwrActual(speeds, curr);
    let sum = 0 ;
    return power.map((sum = 0, n =>  sum += n  / 3600
                                    * ( 1 * ( n > 0 || (regen_status && !!regen_value) ))
                                    * ( ( regen_value ) / 100 * ( n < 0 ) || 1)  
                                    )) ;
}

/**
 * Add SOC trace to plot
 * @param {object} e, event object
 * @param {string} id
 * @returns 
 */
export function plotSOCActual(id, curr, e){
    e.preventDefault();
    let traces = document.getElementById(id).data

    let trace_name = 'SOC Cont';

    if (curr == 'peak') trace_name = 'SOC Peak';

    if (traces.map(v=>v.name).indexOf(trace_name) > -1) return;

    let [labels, speeds] = [...getData()];
    let soc = SOC(speeds, curr);

    Plotly.addTraces(id, {
        name: trace_name,
        type: 'scatter', 
        x: labels, 
        y: soc,
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
export function plotCurrentActual(id, curr = 'cont', e){
    e.preventDefault();
    let traces = document.getElementById(id).data
    let trace_name = 'Current Cont';

    if (curr == 'peak'){
        trace_name = 'Current Peak';
    }
    
    if (traces.map(v=>v.name).indexOf(trace_name)>-1) return;
    
    let [labels, speeds] = [...getData()];
    let current = currentActual(speeds, curr);

    Plotly.addTraces(id, {
        name: trace_name,
        type: 'scatter', 
        x: labels, 
        y: current,
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
export function plotCycleEnergy(id, regen='off', trace_name, curr, e){
    e.preventDefault();
    let traces = document.getElementById(id).data
    let regen_value = 0;
    if (regen == 'on') {
        regen_value = document.getElementById('edit-regen-capacity').value
    }

    // don't replot trace if already plotted
    if (traces.map(v=>v.name).indexOf(trace_name)>-1) return;

    let [labels, speeds] = [...getData()];
    let energy = cycle_energy( speeds, true, regen_value, curr );

    Plotly.addTraces(id, {
        name: trace_name,
        type: 'scatter', 
        x: labels, 
        y: energy,
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
export function plotPwrDmnd(id, e){
    e.preventDefault();
    
    let traces = document.getElementById(id).data

    if (traces.map(v=>v.name).indexOf('Power Demand')>-1) return;

    let [labels, speeds] = [...getData()];
    let power = total_cycle_power( speeds );

    Plotly.addTraces(id, {
        name:'Power Demand',
        type: 'scatter', 
        x: labels, 
        y: power,
        xaxis: 'x',
        yaxis: 'y2',
        mode : 'lines',
        line : {
            color: '#9467bd',
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
export function plotPwrActual(id, curr, e){
    e.preventDefault();
    
    let traces = document.getElementById(id).data

    let trace_name = 'Motor Power Continuous';

    if (curr == 'peak') trace_name = 'Motor Power Peak';

    if (traces.map(v=>v.name).indexOf(trace_name)>-1) return;
    if (traces.map(v=>v.name).indexOf('Max Power Lim ' + curr)>-1) return;
    if (traces.map(v=>v.name).indexOf('Min Power Lim ' + curr)>-1) return;

    let [labels, speeds] = [...getData()];

    let actualPwr = motorPwrActual( speeds, curr );
    let motorPwr = totalMotorPower( curr );
    
    Plotly.addTraces(id, {
        name:'Max Power Lim '+ curr,
        type: 'scatter', 
        x: labels, 
        y: labels.map(v=>motorPwr),
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
        x: labels, 
        y: labels.map(v=>-motorPwr),
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
        name: trace_name,
        type: 'scatter', 
        x: labels, 
        y: actualPwr,
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