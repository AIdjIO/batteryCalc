import * as batt from './batterycalc.js'

(function($, Drupal, drupalSettings){
    'use strict';

    Drupal.behaviors.plotlyjs = {
        attach: function attach(context, settings) {

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
                    showlegend: true,
                    autosize: true,
                    height: 450,
                    automargin: false,
                },
                layout_vehicle : {
                title: 'Vehicle Power and Energy',
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

            let [labels, speeds]  = [...batt.getData()];
            const speed1 = {
                x: labels,
                y: speeds.map(v => v * 3.6),
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
            speed2.marker.color = speeds;

            const config = {
                scrollZoom: true,
                responsive: true,
                editable: false
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

            batt.calculateSpeedInfo(speeds);

            let textareaSpeed = document.getElementsByTagName("textarea")[0];
            textareaSpeed.addEventListener('keyup', batt.updatePlotly.bind(this, speedPlots, config));

            let cyclePowerDmndBtn = document.getElementById('cycle_power_dmnd');
            let motorPowerContBtn = document.getElementById('motor_power_cont');
            let motorPowerPeakBtn = document.getElementById('motor_power_peak');
            let energyRegenOnSize = document.getElementById('cycle_energy_regen_on_size');
            let energyRegenOnSpec = document.getElementById('cycle_energy_regen_on_spec');
            let energyRegenOffSize = document.getElementById('cycle_energy_regen_off_size');
            let energyRegenOffSpec = document.getElementById('cycle_energy_regen_off_spec');
            let cycleSOC = document.getElementById('cycle_soc');
            let cycleCurrentCont = document.getElementById('cycle_current_continuous');
            let cycleCurrentPeak = document.getElementById('cycle_current_peak');
           
            cyclePowerDmndBtn.addEventListener('click', batt.plotPwrDmnd.bind(this, 'speedPlotPackSize'));
            motorPowerContBtn.addEventListener('click', batt.plotPwrActual.bind(this, 'speedPlotPackSize', 'cont'))
            motorPowerPeakBtn.addEventListener('click', batt.plotPwrActual.bind(this, 'speedPlotPackSize', 'peak'))
            energyRegenOnSize.addEventListener('click', batt.plotCycleEnergy.bind(this, 'speedPlotPackSize', 'on', 'Energy regen on', 'cont'));
            energyRegenOnSpec.addEventListener('click', batt.plotCycleEnergy.bind(this, 'speedPlotPackSpec', 'on', 'Energy w/ regen', 'cont'));
            energyRegenOffSize.addEventListener('click', batt.plotCycleEnergy.bind(this,'speedPlotPackSize', 'off', 'Energy regen off', 'cont'));
            energyRegenOffSpec.addEventListener('click', batt.plotCycleEnergy.bind(this,'speedPlotPackSpec', 'off', 'Energy w/o regen', 'cont'));
            cycleCurrentCont.addEventListener('click', batt.plotCurrentActual.bind(this, 'speedPlotPackSpec', 'cont'));
            cycleCurrentPeak.addEventListener('click', batt.plotCurrentActual.bind(this, 'speedPlotPackSpec', 'peak'));
            cycleSOC.addEventListener('click', batt.plotSOCActual.bind(this, 'speedPlotPackSpec', 'cont'));

            $(document).on('shown.bs.tab', function (event) {
                var doc = $(".tab-pane.active .js-plotly-plot");
                for (var i = 0; i < doc.length; i++) {
                    Plotly.relayout(doc[i], {autosize: true});
                }
            })
        }
      };
})(jQuery, Drupal)