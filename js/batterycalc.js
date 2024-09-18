let speedChart;

(function($, Drupal, drupalSettings){
    'use strict';
    // $(document).ready(function(){
    //     $('input').on('focus', function(){
    //         $(this).parent().next('.error').text('');
    //     });
    // });
    Drupal.behaviors.plotlyjs = {
        attach: function attach(context, settings) {
            let traces = [];

            var layout = {
                title: 'Vehicle Test Cycle',
                xaxis: {title: 'time [s]'},
                yaxis: {title: 'speed [km/h]'},
                showlegend: false,
                autosize: true,
                // width: 1000,
                // height: 800,
                automargin: true,
                margin: {
                  l: 50,
                  r: 50,
                  b: 100,
                  t: 100,
                  pad: 4,
                },
                legend: {
                    y: 1,
                    traceorder: 'reversed',
                    font: {size: 16},
                    yref: 'paper',
                    margin: { t: 0 }
                },
                // paper_bgcolor: '#7f7f7f',
                paper_bgcolor: '#fcf2d7',// DaVinci paper color
                // plot_bgcolor: '#c7c7c7'
                plot_bgcolor: '#faebd7' //Antique white
            };
            
            let x, y;
            [ x, y ] = [...getData()];

            const trace1 = {
                x: x,
                y: y,
                mode : 'lines+markers',
                name : 'Speed',
                line : {shape: 'linear'},
                type : 'scatter',
            };
            
            traces.push(trace1)

            Plotly.newPlot( document.getElementById('myDiv'), traces, layout );
                
            calculateSpeedInfo();

            let textareaSpeed = document.getElementsByTagName("textarea")[0];

            textareaSpeed.addEventListener('keyup', updatePlotly.bind(this, traces, layout));
            textareaSpeed.addEventListener("focusout", updatePlotly.bind(this, traces, layout));
            textareaSpeed.addEventListener("change", updatePlotly.bind(this, traces, layout));
        }
      };
   
    // Drupal.behaviors.batterycalc = {
    //     attach: function (context, settings) {
        
    //     if (speedChart !== undefined){
    //         speedChart.destroy();
    //     }
    //     speedChart = new Chart(document.getElementById("line-chart"), {
    //         type: 'line',
    //         data: {
    //             labels: [...Array((getData()[0]).length).keys()],
    //             datasets: [{
    //                 data: getData()[0],
    //                 label: "Speed Profile",
    //                 borderColor: "#3e95cd",
    //                 fill: false
    //                 },
    //             ]
    //         },
    //         options: {
    //             responsive: false,
    //             plugins: {
    //                 title: {
    //                     display: true,
    //                     text: 'Driving Cycle Speed',
    //                 }
    //             },
    //             scales: {
    //                 x: {
    //                     display: true
    //                 },
    //                 y: {
    //                     display: true
    //                 }
    //             }
    //         }
    //     });
    
        
    //         let textareaSpeed = document.getElementsByTagName("textarea")[0];

    //         calculateSpeedInfo();

    //         textareaSpeed.addEventListener('keyup', updateChart);
    //         textareaSpeed.addEventListener("focusout", updateChart);
    //         textareaSpeed.addEventListener("change", updateChart);
    //     }
    // }
})(jQuery, Drupal)


function getData(){
    let textareaSpeed = document.getElementsByTagName("textarea")[0];

    let textareaSpeedArray = [];
    let textareaSpeedLabel = [];

    textareaSpeedArray = (textareaSpeed.value).replace(/(^\s*,)|(,\s*$)/g, '').split(',').map(element => parseFloat(element));
    textareaSpeedLabel = [...Array(textareaSpeedArray.length).keys()];

    return [ textareaSpeedLabel, textareaSpeedArray ];
}

function calculateSpeedInfo(){
    // this function calculates the min, max, average speed of the cycle
    // and the total distance in km.
    // speed cycle is specified in km/h with a sample time of one second
    let speedArray;
    [_, speedArray] = [...getData()];
    let speedInfo = document.getElementById('speed_info');

    let speedArrayShifted = [...speedArray];
    let element = speedArrayShifted.shift();
    let length = speedArrayShifted.push(0);

    let accelerationValues = speedArray.map((v,i)=>(speedArrayShifted[i] - v)/3.6);

    let averageAcceleration = (accelerationValues.filter(v => v > 0).reduce((a, b) => a + b, 0) 
                            / accelerationValues.filter(v => v > 0).length)
                            .toFixed(3);
    let averageDeceleration = (accelerationValues.filter(v => v < 0).reduce((a, b) => a + b, 0)
                            / accelerationValues.filter(v => v < 0).length)
                            . toFixed(3);

    let totalDistance = speedArray.reduce((a, b) => a + b, 0) || 0;
    let averageSpeed = (totalDistance / speedArray.length  || 0).toFixed(2) ;

    speedInfo.innerHTML = `<i>This drive cycle has a minimum speed of ${Math.min(...speedArray)||0} km/h, a maximum speed of ${Math.max(...speedArray)||0} km/h,
                                 an average speed of ${averageSpeed} km/h, an average acceleration of ${averageAcceleration} m/s², an average deceleration of ${averageDeceleration} m/s²and a total distance of ${(totalDistance/3600).toFixed(2)} km</i>`
}
function updateChart(e) { 
    
    calculateSpeedInfo();

    let labels, data1 = [...getData()];
    speedChart.data.datasets[0].data = data1;
    speedChart.data.labels = labels;

    speedChart.update();
    // speedChart.render();
}

function updatePlotly(traces, layout){
    let labels, data;

    [labels, data] = [...getData()];
    traces[0].x = labels;
    traces[0].y = data;

    Plotly.react('myDiv', traces, layout);
}