import * as batt from './batterycalc.js'

(function($, Drupal, drupalSettings){
    'use strict';

    Drupal.behaviors.plotlyjs = {
        attach: function attach(context, settings) {
            let traces = []; // hold all plot lines data

            var layout = {
                title: 'Vehicle Test Cycle',
                xaxis: {
                    domain: [0.0, 0.9],
                    // rangeslider: {},
                    tickmode: "linear", //  If "linear", the placement of the ticks is determined by a starting position `tick0` and a tick step `dtick`
                    tick0: 0,
                    dtick: 500,
                    anchor: 'y',
                    // rangeslider: {},
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
                automargin: true,
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
            };
            

            let [labels, speeds]  = [...batt.getData()];
            // console.log(speeds);
            const trace1 = {
                x: labels,
                y: speeds.map(v => v * 3.6),
                name : 'Speed',
                type : 'scatter',
                mode : 'lines',
                line : {
                    color:'black',
                    shape: 'linear',
                    width: 1,
                    },
                // marker: {
                //     size: 4,
                //     color: speeds,
                // },
            };

            const config = {
                scrollZoom: true,
                responsive: true,
                // editable: true
            }
            
            traces.push(trace1)

            Plotly.newPlot( 'speedPlot', traces, layout, config );

            batt.calculateSpeedInfo(speeds);

            let textareaSpeed = document.getElementsByTagName("textarea")[0];
            textareaSpeed.addEventListener('keyup', batt.updatePlotly.bind(this, traces, layout, config));

            const projTitle = document.getElementById('edit-environment');

            let cyclePowerDmndBtn = document.getElementById('cycle_power_dmnd');
            let motorPowerContBtn = document.getElementById('motor_power_cont');
            let motorPowerPeakBtn = document.getElementById('motor_power_peak');
            let energyRegenOff = document.getElementById('cycle_energy_regen_off');
            let energyRegenOn = document.getElementById('cycle_energy_regen_on');
            let cycleSOC = document.getElementById('cycle_soc');
            let cycleCurrentCont = document.getElementById('cycle_current_continuous');
            let cycleCurrentPeak = document.getElementById('cycle_current_peak');

            cyclePowerDmndBtn.addEventListener('click', batt.plotPwrDmnd);
            motorPowerContBtn.addEventListener('click', batt.plotPwrActualCont)
            motorPowerPeakBtn.addEventListener('click', batt.plotPwrActualPk)
            energyRegenOn.addEventListener('click', batt.plotEnergyRegenOn);
            energyRegenOff.addEventListener('click', batt.plotEnergyRegenOff);
            cycleCurrentCont.addEventListener('click', batt.plotCurrentActualCont);
            cycleCurrentPeak.addEventListener('click', batt.plotCurrentActualPeak);
            cycleSOC.addEventListener('click', batt.plotSOCActualCont);
            


        }
      };
})(jQuery, Drupal)