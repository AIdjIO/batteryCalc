let speedChart;

(function($, Drupal, drupalSettings){
    'use strict';
    // $(document).ready(function(){
    //     $('input').on('focus', function(){
    //         $(this).parent().next('.error').text('');
    //     });
    // });
   


   
        Drupal.behaviors.batterycalc = {
          attach: function (context, settings) {
            
            if (speedChart !== undefined){
                speedChart.destroy();
            }
            speedChart = new Chart(document.getElementById("line-chart"), {
                type: 'line',
                data: {
                    labels: [...Array((getData()[0]).length).keys()],
                    datasets: [{
                        data: getData()[0],
                        label: "Speed Profile",
                        borderColor: "#3e95cd",
                        fill: false
                        },
                    ]
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Driving Cycle Speed',
                        }
                    },
                    scales: {
                        x: {
                            display: true
                        },
                        y: {
                            display: true
                        }
                    }
                }
            });
        
            function getData(){
                let textareaSpeed = document.getElementsByTagName("textarea")[0];
                let textareaSpeedArray = [];
                let textareaSpeedLabel = [];
                textareaSpeedArray = (textareaSpeed.value).replace(/(^\s*,)|(,\s*$)/g, '').split(',').map(element => parseFloat(element));
                textareaSpeedLabel = [...Array(textareaSpeedArray.length).keys()];
        
                return [textareaSpeedArray, textareaSpeedLabel];
            }

            function calculateSpeedInfo(){
                // this function calculates the min, max, average speed of the cycle
                // and the total distance in km.
                // speed cycle is specified in km/h with a sample time of one second
                let speedArray;
                [speedArray, _] = [...getData()];
                let speedInfo = document.getElementById('speed_info');

                let totalDistance = speedArray.reduce((a,b) => a+b, 0) || 0;
                let averageSpeed = Math.round(totalDistance / speedArray.length  || 0, 2) ;
                speedInfo.innerHTML = `<i>This drive cycle has a minimum speed of ${Math.min(...speedArray)||0} km/h, a maximum speed of ${Math.max(...speedArray)||0} km/h,
                                             an average speed of ${averageSpeed} km/h, and a total distance of ${Math.round(totalDistance/3600, 2)} km</i>`
            }
            function updateChart(e) { 
                
                calculateSpeedInfo();

                let data1, labels = [...getData()];
                speedChart.data.datasets[0].data = data1;
                speedChart.data.labels = labels;
        
                speedChart.update();
                // speedChart.render();
            }
                let textareaSpeed = document.getElementsByTagName("textarea")[0];

                calculateSpeedInfo();

                textareaSpeed.addEventListener('keyup', updateChart);
                textareaSpeed.addEventListener("focusout", updateChart);
                textareaSpeed.addEventListener("change", updateChart);
        }
    }
})(jQuery, Drupal)


  