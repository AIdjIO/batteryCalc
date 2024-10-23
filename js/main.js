import * as batt from './batterycalc.js'

(function($, Drupal, drupalSettings){
    'use strict';

    Drupal.behaviors.plotlyjs = {
        attach: function attach(context, settings) {

            batt.updatePlotly();
            
            let inputs = [...document.querySelectorAll(
                            'input[type=number], select, input[type=radio], textarea')];
            
            // let voltageRadio = document.querySelectorAll('input[type=radio][data-drupal-selector*="edit-voltage-architecture-"]');

            inputs.forEach(input => {
                input.addEventListener('change', batt.updatePlotly);
            });
            
            let table = new DataTable('#cell_table', {
                responsive: true,
                fixedHeader: true,
                columnDefs: [{
                    "defaultContent": "-",
                    "targets": "_all"
                  }],
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
                            // {
                            //     extend: 'fixedColumns',
                            //     text: 'FixedColumns',
                            //     config: {
                            //         start: 2,
                            //         end: 0
                            //     }
                            // },
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

            // let rows = table.rows().data();
            let headerName = table.columns().header().map(d => d.textContent).toArray();
            headerName.shift();

            table.rows().nodes()
                .to$().find( 'input[type=radio][data-drupal-selector*="edit-cell-table-"]')
                .each(function( i, element ) {
                    let rowData = table.row(element.parentNode.parentNode).data();
                    rowData.shift();

                    element.addEventListener('click',()=>{
                            
                    let dataObj = Object.fromEntries(headerName.map((k,j) => [k, rowData[j]] ));
    
                    let cellDBKeys = {
                        "edit-cell-voltage-nom":"nom_v",
                        "edit-cell-voltage-max":"max_v",
                        "edit-cell-voltage-min":"cutoff_v",
                        "edit-width":"width_mm",
                        "edit-height":"height_mm",
                        "edit-depth":"depth_mm",
                        "edit-diameter":"dia_mm",
                        "edit-cell-capacity":"ah_rate",
                        "edit-cell-mass":"masss_g",
                    };
    
                    (Object.keys(cellDBKeys)).forEach(k=>{
                        document.querySelector('input[data-drupal-selector='+k+']').value 
                        = dataObj[cellDBKeys[k]];  
                    });
                })
            })

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