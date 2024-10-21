import * as batt from './batterycalc.js'

(function($, Drupal, drupalSettings){
    'use strict';

    Drupal.behaviors.plotlyjs = {
        attach: function attach(context, settings) {

            batt.updatePlotly();
            
            let inputs = [...document.querySelectorAll(
                            'input[type=number], select, radio, input[type=radio], textarea')];

            inputs.forEach(input => {
                input.addEventListener('change', batt.updatePlotly);
                        });

            let table = new DataTable('#cell_table');
         
            $(document).on('shown.bs.tab', function (event) {
                var doc = $(".tab-pane.active .js-plotly-plot");
                for (var i = 0; i < doc.length; i++) {
                    Plotly.relayout(doc[i], {autosize: true});
                }
            })
        }
      };
})(jQuery, Drupal)