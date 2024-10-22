import * as batt from './batterycalc.js'

(function($, Drupal, drupalSettings){
    'use strict';

    Drupal.behaviors.plotlyjs = {
        attach: function attach(context, settings) {

            batt.updatePlotly();
            
            let inputs = [...document.querySelectorAll(
                            'input[type=number], select, radio, input[type=radio][data-drupal-selector*="edit-voltage-architecture-"], textarea')];
            
            let voltageRadio = document.querySelectorAll('input[type=radio][data-drupal-selector*="edit-voltage-architecture-"]');

            console.log(voltageRadio);

            let cellRadios = document.querySelectorAll('input[type=radio][data-drupal-selector*="edit-cell-table-"')


            inputs.forEach(input => {
                input.addEventListener('change', batt.updatePlotly);
                        });

            let table = new DataTable('#cell_table', {
                responsive: true,
                fixedHeader: true,
                // order: [[5, 'asc']],
                // rowGroup: {
                //     dataSrc: 5
                // },
                select: {
                    style: 'os',
                    selector: 'td:first-child',
                    headerCheckbox: false
                },
                layout: {
                    top1: {
                        searchPanes: {
                            initCollapsed: true,
                            viewTotal: true,
                            layout: 'columns-1',
                        }
                    },
                    topStart: {
                        buttons: [
                            {
                                extend: 'fixedColumns',
                                text: 'FixedColumns',
                                config: {
                                    start: 2,
                                    end: 0
                                }
                            },
                            {
                                extend: 'excelHtml5',
                                title: 'Cell DB'
                            },
                            {
                                extend: 'pdfHtml5',
                                title: 'Cell DB',
                                download: 'open'
                            }
                        ]
                    },
                },

                pageLength: 35,
            });

            document
                .querySelector('div.dtsp-verticalPanes')
                .appendChild(table.searchPanes.container().get(0));

            $(document).on('shown.bs.tab', function (event) {
                var doc = $(".tab-pane.active .js-plotly-plot");
                for (var i = 0; i < doc.length; i++) {
                    Plotly.relayout(doc[i], {autosize: true});
                }
            })


        }
      };
})(jQuery, Drupal)