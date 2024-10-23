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
                // responsive: true,
                fixedHeader: true,
                paging: true,
                lengthChange: true,
                searching: true,
                ordering: true,
                info: true,
                autoWidth: true,
                pageLength: 30,
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
            });

            // let rows = table.rows().data();
            let headerName = table.columns().header().map(d => d.textContent).toArray();
            headerName.shift();

            let cellDBKeys = {
                "edit-cell-voltage-nom":"nom_v",
                "edit-cell-voltage-max":"max_v",
                "edit-cell-voltage-min":"cutoff_v",
                "edit-width":"width_mm",
                "edit-height":"height_mm",
                "edit-depth":"depth_mm",
                "edit-diameter":"dia_mm",
                "edit-cell-capacity":"ah_rate",
                "edit-cell-mass":"mass_g",
            };

            table.rows().nodes()
                .to$().find( 'input[type=radio][data-drupal-selector*="edit-cell-table-"]')
                .each(function( i, element ) {
                    
                    let rowData = table.row(element.parentNode.parentNode).data();
                    rowData.shift();

                    //initialised cell values with values of first row in cell selection
                    if (i==0) {
                        Object.keys(cellDBKeys).forEach(k => {
                            let dataObj 
                            = Object.fromEntries(headerName.map((k,j) => [k, rowData[j]] ));
                            
                            document.querySelector('input[data-drupal-selector='+k+']').value
                            = dataObj[cellDBKeys[k]]; 
                        })
                    }

                    element.addEventListener('click',()=>{                            
                        let dataObj = Object.fromEntries(headerName.map((k,j) => [k, rowData[j]] ));
        
                        (Object.keys(cellDBKeys)).forEach(k=>{
                            
                            // if (dataObj['ffactor'] === 'Cylindrical' && cellDBKeys[k] === 'depth_mm'){
                            //     document.querySelector('input[data-drupal-selector='+k+']').value 
                            //     = dataObj['dia_mm'];
                            // } else {
                                document.querySelector('input[data-drupal-selector='+k+']').value 
                                = dataObj[cellDBKeys[k]]; 
                            // }
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