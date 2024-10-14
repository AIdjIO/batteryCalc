import * as batt from './batterycalc.js'

(function($, Drupal, drupalSettings){
    'use strict';

    Drupal.behaviors.plotlyjs = {
        attach: function attach(context, settings) {

            let textareaSpeed = document.getElementsByTagName("textarea")[0];
            textareaSpeed.addEventListener('keyup', batt.updatePlotly);

            let ranges = [...document.querySelectorAll('input[type=range]')];

            ranges.forEach(range => {
                range.setAttribute("onchange",
                            "this.parentElement.nextElementSibling.value = this.value");

                range.parentElement.nextElementSibling.value = range.value;
                range.addEventListener('change', batt.updatePlotly);
                        });

            document.getElementById('edit-voltage-architecture')
            .addEventListener('change', batt.updatePlotly); 

            let cell_db = document.getElementById('edit-cell-db');
            cell_db.addEventListener('change', batt.updatePlotly);
            let event = new Event('change');
            cell_db.dispatchEvent(event);       
            
            let cell_wrapper = document.getElementById('cell-wrapper');

            let cell_inputs = cell_wrapper.querySelectorAll('input[type=number]');

            for (let cells of cell_inputs){
                cells.addEventListener('change', batt.updatePlotly);
            }
            
            $(document).on('shown.bs.tab', function (event) {
                var doc = $(".tab-pane.active .js-plotly-plot");
                for (var i = 0; i < doc.length; i++) {
                    Plotly.relayout(doc[i], {autosize: true});
                }
            })
        }
      };
})(jQuery, Drupal)