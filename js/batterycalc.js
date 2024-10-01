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
export function updatePlotly(traces, layout, config){

    let [labels, data] = [...getData()];

    calculateSpeedInfo(data);
    
    traces[0].x = labels;
    traces[0].y = data.map(v => v * 3.6 );

    Plotly.react('speedPlot', traces, layout, config);
}

/**
 * calculate acceleration values from speed array [m/s2]
 * assuming sample time of 1s.
 * 
 * @param {array} speeds 
 * @returns array
 */
export function acceleration(speeds) {

    return speeds.map( (v,i) => ( (speeds[i+1] || v) - v) );
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
    let range = document.getElementById('edit-vehicle-range').value;
    let rho = document.getElementById('edit-air-density').value;
    let alpha = document.getElementById('edit-road-slope').value;


    return speeds.map((v,i) =>( mass * (((speeds[i+1] || v) - v) 
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

export function totalMotorPowerCont(){
    let fr_motor_pwr_cont = document.querySelectorAll("[data-drupal-selector='edit-front-motor-power-continuous']")[0];
    let rr_motor_pwr_cont = document.querySelectorAll("[data-drupal-selector='edit-rear-motor-power-continuous']")[0];

    return (fr_motor_pwr_cont ? +fr_motor_pwr_cont.value : 0 ) + (rr_motor_pwr_cont ? +fr_motor_pwr_cont.value : 0)
    }

export function totalMotorPowerPeak(){
    let fr_motor_pwr_pk = document.querySelectorAll("[data-drupal-selector='edit-front-motor-power-peak']")[0];
    let rr_motor_pwr_pk = document.querySelectorAll("[data-drupal-selector='edit-rear-motor-power-peak']")[0];
   
    return (fr_motor_pwr_pk ? +fr_motor_pwr_pk.value : 0 ) + (rr_motor_pwr_pk ? +fr_motor_pwr_pk.value : 0)
    }

/**
 * Calculates the motor power on the cycle considering 
 * regen braking level and peak motor power
 * @param {array} speeds 
 * @returns motor power peak
 */
export function motorPwrActualCont(speeds){
    let power_dmnd = total_cycle_power( speeds );
    let motorPower = totalMotorPowerCont();

    //powertrain efficiency (conversion from electrical to mechanical)
    let eff = document.getElementById('edit-powertrain-efficiency').value;
    let regen = document.getElementById('edit-regen-capacity').value;


    return power_dmnd.map(v => {
        if (v / eff >=0 && v / eff < motorPower) {
            return v / eff;
        }
        if (v / eff >= motorPower){
            return motorPower;
        }
        if (v / eff < 0 && v / eff < -motorPower * regen / 100) {
            return -motorPower * regen / 100;
        }
        return v / eff;
    });
}

/**
 * Calculates the motor power on the cycle considering
 * regen braking and continuous motor power 
 * 
 * @param {array} speeds 
 * @returns {array} motor power peak
 */
export function motorPwrActualPeak(speeds){

    let power_dmnd = total_cycle_power( speeds );
    let motorPower = totalMotorPowerPeak();
    
    //powertrain efficiency (conversion from electrical to mechanical)
    let eff = document.getElementById('edit-powertrain-efficiency').value;
    let regen = document.getElementById('edit-regen-capacity').value;

    return power_dmnd.map(v => {
        if (v / eff >=0 && v<motorPower) {
            return v;
        }
        if (v / eff >= motorPower){
            return motorPower;
        }
        if (v / eff < 0 && v / eff <-motorPower*regen/100) {
            return -motorPower*regen/100;
        }
        return v / eff;
    });
}

/**
 * Calculates SOC from current of continuous power from motor
 * @param {array} speeds 
 * @returns {array} soc
 */
export function SOCCont(speeds){
    let E = 1e3*document.getElementById("pack_energy_container").value;
    let V = document.getElementById('edit-voltage-architecture-0').isChecked? 400 : 800;

    let C = E/V;

    let current=currentActualCont(speeds);
    let soc = 100;
    
    return current.map((v => soc = Math.min(soc,100) - 100 * v / C / 3600))
}

/**
 * Calculates SOC from current of peak power from motor
 * 100% - 100 * current * time / pack_capacity 
 * @param {array} speeds 
 * @returns {array} soc
 */
export function SOCPeak(speeds){
    let E = 1e3*document.getElementById("pack_energy_container").value;
    let V = document.getElementById('edit-voltage-architecture-0').isChecked? 400 : 800;

    let C = E/V;

    let current=currentActualPeak(speeds);
    
    return current.map((v => soc = Math.min(soc,100) - 100 * v / C / 3600))
}

/**
 * Contiunous current
 * (v -Ri)*i = P, Ri2 -vi + P = 0
 * @param {array} speeds 
 * @returns {aaray} of current for motor in continuous operation
 */
export function currentActualCont(speeds){
    let actualPwrCont = motorPwrActualCont(speeds);
    let V = 800; // pack voltage
    let R = 0.1; // pack resistance

    return actualPwrCont.map(p => (V - Math.sqrt(V * V - 4 * R * p * 1000)) / 2 / R )
}

/**
 * Peak current
 * (v -Ri)*i = P, Ri2 -vi + P = 0
 * @param {array} speeds 
 * @returns {aaray} of current for motor in continuous operation
 */
export function currentActualPeak(speeds){
    let actualPwrPeak = motorPwrActualPeak(speeds);
    let V = 800; // pack voltage
    let R = 0.1; // pack resistance

    return actualPwrPeak.map(p => (V - Math.sqrt(V * V - 4 * R * p * 1000)) / 2 / R)
}

/**
 * Calculates energy consumption over the cycle
 * with regenerative braking
 * @param {array} speeds
 * @param {boolean} regen
 * @returns {array} energy with regen
 */
export function cycle_energy(speeds, regen_status, regen_value){
    if (arguments.length === 2) regen_value = 0;
    let power = motorPwrActualCont(speeds);
    let sum = 0 ;
    return power.map((sum = 0, n =>  sum += n / 3600 
                                    * ( 1 * ( n > 0 || (regen_status && !!regen_value) ))
                                    * ( ( regen_value ) / 100 * ( n < 0 ) || 1)  
                                    )) ;
}

export function plotSOCActualCont(e){
    e.preventDefault();
    let traces = document.getElementById('speedPlot').data

    if (traces.map(v=>v.name).indexOf('SOC Cont') > -1) return;

    let [labels, speeds] = [...getData()];
    let soc = SOCCont(speeds);

    Plotly.addTraces('speedPlot', {
        name:'SOC Cont',
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

export function plotCurrentActualCont(e){
    e.preventDefault();
    let traces = document.getElementById('speedPlot').data

    if (traces.map(v=>v.name).indexOf('Current Cont')>-1) return;

    let [labels, speeds] = [...getData()];
    let current = currentActualCont(speeds);

    Plotly.addTraces('speedPlot', {
        name:'Current Cont',
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

export function plotCurrentActualPeak(e){
    e.preventDefault();
    let traces = document.getElementById('speedPlot').data

    if (traces.map(v=>v.name).indexOf('Current Peak')>-1) return;

    let [labels, speeds] = [...getData()];
    let current = currentActualPeak(speeds);

    Plotly.addTraces('speedPlot', {
        name:'Current Peak',
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

export function plotEnergyRegenOn(e){
    e.preventDefault();
    let traces = document.getElementById('speedPlot').data
    let regen_value = document.getElementById('edit-regen-capacity').value

    // don't replot trace if already plotted
    if (traces.map(v=>v.name).indexOf('Energy Regen On')>-1) return;

    let [labels, speeds] = [...getData()];
    let energy = cycle_energy( speeds, true, regen_value );

    Plotly.addTraces('speedPlot', {
        name:'Energy Regen On',
        type: 'scatter', 
        x: labels, 
        y: energy,
        xaxis: 'x',
        yaxis: 'y3',
        mode : 'lines',
        line : {
            color: 'green',
            shape: 'spline', 
            smoothing: 1.3,
            width: 1,
            },
    });
}

export function plotEnergyRegenOff(e){
    e.preventDefault();

    let traces = document.getElementById('speedPlot').data

    if (traces.map(v=>v.name).indexOf('Energy Regen Off')>-1) return;

    let [labels, speeds] = [...getData()];
    let energy = cycle_energy( speeds, false );

    Plotly.addTraces('speedPlot', {
        name:'Energy Regen Off',
        type: 'scatter', 
        x: labels, 
        y: energy,
        xaxis: 'x',
        yaxis:'y3',
        mode : 'lines',
        line : {
            color: 'red',
            shape: 'spline', 
            smoothing: 1.3,
            width: 1,
            },
    });
}

export function plotPwrDmnd(e){
    e.preventDefault();
    
    let traces = document.getElementById('speedPlot').data

    if (traces.map(v=>v.name).indexOf('Power Demand')>-1) return;

    let [labels, speeds] = [...getData()];
    let power = total_cycle_power( speeds );

    Plotly.addTraces('speedPlot', {
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

export function plotPwrActualCont(e){
    e.preventDefault();
    
    let traces = document.getElementById('speedPlot').data

    if (traces.map(v=>v.name).indexOf('Motor Power Actual')>-1) return;
    if (traces.map(v=>v.name).indexOf('Max Power Limit')>-1) return;
    if (traces.map(v=>v.name).indexOf('Min Power Limit')>-1) return;

    let [labels, speeds] = [...getData()];
    
    let actualPwrCont = motorPwrActualCont( speeds );
    let motorPwr = totalMotorPowerCont();
    // let xmin = Math.min(...labels);
    // let xmax = Math.max(...labels);
    
    
    Plotly.addTraces('speedPlot', {
        name:'Motor Power Actual',
        type: 'scatter', 
        x: labels, 
        y: actualPwrCont,
        mode : 'lines',
        xaxis: 'x',
        yaxis: 'y2',
        line : {
            shape: 'spline', 
            smoothing: 1.3,
            width: 1,
            },
    }
    );
    Plotly.addTraces('speedPlot', {
        name:'Max Power Limit',
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
    }
    );
    Plotly.addTraces('speedPlot', {
        name:'Min Power Limit',
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
    });
}

export function plotPwrActualPk(e){
    e.preventDefault();
    
    let traces = document.getElementById('speedPlot').data

    if (traces.map(v=>v.name).indexOf('Motor Power Peak')>-1) return;
    if (traces.map(v=>v.name).indexOf('Max Peak Power Limit')>-1) return;
    if (traces.map(v=>v.name).indexOf('Min Peak Power Limit')>-1) return;

    let [labels, speeds] = [...getData()];
    
    let actualPwrCont = motorPwrActualPeak( speeds );
    let motorPwr = totalMotorPowerPeak();
    // let xmin = Math.min(...labels);
    // let xmax = Math.max(...labels);
    
    
    Plotly.addTraces('speedPlot', {
        name:'Motor Power Peak',
        type: 'scatter', 
        x: labels, 
        y: actualPwrCont,
        mode : 'lines',
        xaxis: 'x',
        yaxis: 'y2',
        line : {
            shape: 'spline', 
            smoothing: 1.3,
            width: 1,
            },
    }
    );
    Plotly.addTraces('speedPlot', {
        name:'Max Peak Power Limit',
        type: 'scatter', 
        x: labels, 
        y: labels.map(v=>motorPwr),
        mode : 'lines',
        yaxis: 'y2',
        line : {
            color: 'rgb(0, 0, 0)',
            shape: 'linear', 
            width: 1,
            },
        visible: 'legendonly'
    }
    );
    Plotly.addTraces('speedPlot', {
        name:'Min Peak Power Limit',
        type: 'scatter', 
        x: labels, 
        y: labels.map(v=>-motorPwr),
        mode : 'lines',
        yaxis: 'y2',
        line : {
            color: 'rgb(0, 0, 0)',
            shape: 'linear', 
            width: 1,
            },
        visible: 'legendonly'
        });
}