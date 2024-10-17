<?php

namespace Drupal\batterycalc\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Markup;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\AppendCommand;
use Drupal\Core\Ajax\AfterCommand;
use Drupal\Core\Ajax\InvokeCommand;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Database\Database;
use Drupal\batterycalc\Form\CycleData;

define("GRAVITY", 9.81);
define("CELL_DB_NAME", 'cell_db2.json');
define("WHEEL_DB_NAME", 'tyre_size.txt');

/**
 * Provides a battery pack calculation form.
 */
class batterycalcAjaxForm extends FormBase {

/**
 * {@inheritdoc}
 */
 public function getFormId() {
    return 'batterycalc_ajax';
 }
 
 /**
  * {@inheritdoc}
  */
 public function buildForm(array $form, FormStateInterface $form_state) {
    $form['#attributes'] = ['class' => 'form-control form-control-sm align-items-start needs-validation',];
    $form['Batt_Title'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Project Title'),
        '#required' => TRUE,
        '#default_value' => 'Project 001',
        '#suffix' => '<div class="error" id="batt_title"></div>'
    ];
    $form['information'] = [
        '#type' => 'vertical_tabs',
        '#default_tab' => 'edit-powertrain',
      ];
    $form['powertrain'] = [
    '#type' => 'details',
    '#title' => $this->t('Powertrain'),
    '#attributes' =>  ['id' => 'Powertrain_Container',
                       'class' => ['p-0', 'm-0',],
                    ],
    ];
    $form['vehicle'] = [
        '#type' => 'details',
        '#title' => $this->t('Vehicle'),
        '#attributes' =>  ['id' => 'Vehicle_Container',
                        'class' => ['p-0', 'm-0',],
                    ],
      ];
    $form['environment'] = [
        '#type' => 'details',
        '#title' => $this->t('Environment'),
        '#attributes' =>  ['id' => 'Environ_Container',
                          'class' => ['p-0', 'm-0',],
                        ],
    ];
    $form['PlotlySpeedPackSize'] =  [
        '#type' => 'markup',
        '#markup' => '<div id = "speedPlotPackSize"></div>',
         '#allowed_tags' => ['canvas', 'button','span','svg', 'path', 'div'],  
      ];
    $form['PlotlySpeedPackSpec'] =  [
        '#type' => 'markup',
        '#markup' => '<div id = "speedPlotPackSpec"></div>',
        '#allowed_tags' => ['canvas', 'button','span','svg', 'path', 'div'],  
    ];
    $form['Speed_Info_Container'] = [
        '#type' => 'container',
        '#markup' => '<div id="speed_info" class="alert alert-primary"></div>',
    ];
    $cycle_options = array_map(function($key) {
        return $key . ' -  ' . CycleData::$cycleData[$key]['title'];
     }, array_keys(CycleData::$cycleData));
    
    $form['Cycle_Select'] = [
        '#type' => 'select',
        '#title' => $this->t('Select predefined test cycle or select "Custom Cycle" to define your own'),
        '#description' => $this->t("note: predefined cycles are editable in 'Speed Profile' text box below"),
        '#options' => array_combine(array_keys(CycleData::$cycleData),$cycle_options),
        '#default_value' => 'WLTC3b',
        '#ajax' => [
            'callback' => '::selectCycle',
            'event' => 'change',
            'wrapper' => 'Speed_Container',
            'effect' => 'fade',
        ]        
    ];
    $form['Speed_Container'] = [
        '#type' => 'details',
        '#title' => $this->t('Speed Profile [km/h] (comma seperated values, 1s sample time)'),
        '#attributes' =>  ['id' => 'Speed_Container',
                            'class' => ['p-0', 'm-0',],
    ],
    ];
    $form['Speed_Container']['Vehicle_Speed'] = [ // expect speed in km/h
        '#type' => 'textarea',
        '#required' => TRUE,
        '#default_value' =>  implode(',',CycleData::$cycleData['WLTC3b']['data']),
        '#suffix' => '<div class="error" id = "vehicle_speed_error"></div>',
    ];
    $form['PlotlySpeedPreview'] =  [
        '#type' => 'markup',
        '#markup' => '<div id = "speedPlotPreview"></div>',
         '#allowed_tags' => ['canvas', 'button','span','svg', 'path', 'div'],  
      ];

    // An AJAX request calls the form builder function for every change.
    // We can change how we build the form based on $form_state.
    $value = $form_state->getValue('Cycle_Select');
    // The getValue() method returns NULL by default if the form element does
    // not exist. It won't exist yet if we're building it for the first time.
    if ($value !== NULL) {
        $form['Speed_Container']['Vehicle_Speed']['#value'] =
        implode(',',CycleData::$cycleData[$value]['data']);
    }
    $form['powertrain']['Powertrain_Container'] = [
        '#type' => 'fieldset',
    ];
    $form['powertrain']['Powertrain_Container']['Drive_Ratio_Differential'] = [
        '#type' => 'number',
        '#step' => 0.01,
        '#min' => 1,
        '#max' => 5,
        '#title' => $this->t('Differential gear ratio'),
        '#default_value' => 2.57,
        '#prefix' => '<div class="row align-items-start p-auto"><div class="col border-end">',
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id = "drive_differential_ratio"></div>',
    ];
    $form['powertrain']['Powertrain_Container']['Drive_Ratio_Gear'] = [
        '#type' => 'number',
        '#step' => 0.01,
        '#min' => 1,
        '#max' => 5,
        '#title' => $this->t('Drive gear ratio'),
        '#default_value' => 1,
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id = "drive_ratio_gear"></div>',
    ];
    $form['powertrain']['Powertrain_Container']['Ancillary_Energy'] = [
        '#type' => 'number',
        '#step' => 0.1,
        '#min' => 1,
        '#max' => 5000,
        '#title' => $this->t('Ancillaries [wh/km]'),
        '#default_value'=> 10,
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id = "ancillary_consumption"></div></div>',
    ];
    $form['powertrain']['Powertrain_Container']['Powertrain_Efficiency'] = [
        '#type' => 'number',
        '#step' => 0.01,
        '#min' => 0.01,
        '#max' => 1,
        '#title' => $this->t('Powertrain Efficiency [-]'),
        '#default_value'=> 0.9,
        '#prefix' => '<div class="col">',
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id = "powertrain_efficiency"></div>',
    ];
    $form['powertrain']['Powertrain_Container']['Regen_Capacity'] = [
        '#type' => 'number',
        '#step' => 0.5,
        '#min' => 0,
        '#max' => 100,
        '#default_value' => 50,
        '#title' => $this->t('Regen. Braking %'),
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id="regen_braking"></div>',
    ];
    $form['powertrain']['Powertrain_Container']['Useable_Capacity'] = [
        '#type' => 'number',
        '#step' => 0.5,
        '#min' => 50,
        '#max' => 100,
        '#default_value' => 95,
        '#title' => $this->t('Useable Capacity %'),
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id="useable_capacity"></div></div>',
    ];
    $form['powertrain']['Powertrain_Container']['Drive_Type'] = [
        '#type' => 'radios',
        '#title' => $this->t('Drive type'),
        '#options' => [0 => $this->t('Front Wheel Drive'),
                       1 => $this->t('Rear Wheel Drive'),
                       2 => $this->t('All Wheel Drive'),
                    ],
        '#default_value' => 0,
        '#prefix' => '<div class="p-0">',
        '#ajax' => [
            'callback' => '::motorConfiguration',
            'event' => 'change',
            'wrapper' => 'motor-container',
            'effect' => 'fade',
        ]
    ];
    $form['powertrain']['Powertrain_Container']['Motor'] = [
        '#type' => 'container',
        '#title' => 'motor power specification(s)',
        '#attributes' => ['id' => 'motor-container',],
        '#suffix' => '</div></div>',
    ];

    switch ($form_state->getValue('Drive_Type')){
        case 0:
        default:
            $form['powertrain']['Powertrain_Container']['Motor']['Front_Motor_Power_Peak'] = [
                '#type' => 'number',
                '#step'=>1,
                '#default_value' => 100,
                '#title' => $this->t('Front Motor Peak Power [kW]'),
                '#required' => TRUE,
                '#suffix' => '<div class="error" id="front_motor_power_peak"></div>',
            ];
            $form['powertrain']['Powertrain_Container']['Motor']['Front_Motor_Power_Continuous'] = [
                '#type' => 'number',
                '#step'=>1,
                '#default_value' => 50,
                '#title' => $this->t('Front Motor Continuous Power [kW]'),
                '#required' => TRUE,
                '#suffix' => '<div class="error" id="front_motor_power_continuous"></div>',
            ];
            break;
        case 1:
            $form['powertrain']['Powertrain_Container']['Motor']['Rear_Motor_Power_Peak'] = [
                '#type' => 'number',
                '#step'=>1,
                '#default_value' => 100,
                '#title' => $this->t('Rear Motor Peak Power [kW]'),
                '#required' => TRUE,
                '#suffix' => '<div class="error" id="rear_motor_power_peak"></div>',
            ];
            $form['powertrain']['Powertrain_Container']['Motor']['Rear_Motor_Power_Continuous'] = [
                '#type' => 'number',
                '#step'=>1,
                '#default_value' => 50,
                '#title' => $this->t('Rear Motor Continuous Power [kW]'),
                '#required' => TRUE,
                '#suffix' => '<div class="error" id="rear_motor_power_continuous"></div>',
            ];
            break;
        case 2:
            $form['powertrain']['Powertrain_Container']['Motor']['Front_Motor_Power_Peak'] = [
                '#type' => 'number',
                '#step'=>1,
                '#default_value' => 100,
                '#title' => $this->t('Front Motor Peak Power [kW]'),
                '#required' => TRUE,
                '#prefix' => '<div class="row align-items-start p-auto"><div class="col">',
                '#suffix' => '<div class="error" id="front_motor_power_peak"></div>',
            ];
            $form['powertrain']['Powertrain_Container']['Motor']['Rear_Motor_Power_Peak'] = [
                '#type' => 'number',
                '#step'=>1,
                '#default_value' => 100,
                '#title' => $this->t('Rear Motor Peak Power [kW]'),
                '#required' => TRUE,
                '#suffix' => '<div class="error" id="rear_motor_power_peak"></div></div>',
            ];
            $form['powertrain']['Powertrain_Container']['Motor']['Front_Motor_Power_Continuous'] = [
                '#type' => 'number',
                '#step'=>1,
                '#default_value' => 50,
                '#title' => $this->t('Front Motor Continuous Power [kW]'),
                '#required' => TRUE,
                '#prefix' => '<div class="col">',
                '#suffix' => '<div class="error" id="front_motor_power_continuous"></div>',
            ];
            $form['powertrain']['Powertrain_Container']['Motor']['Rear_Motor_Power_Continuous'] = [
                '#type' => 'number',
                '#step'=> 1,
                '#default_value' => 50,
                '#title' => $this->t('Rear Motor Continuous Power [kW]'),
                '#required' => TRUE,
                '#suffix' => '<div class="error" id="rear_motor_power_continuous"></div></div></div>',
            ];
            break;
    };

    $form['environment']['Environment_Container'] = [
        '#type' => 'fieldset',
    ];
    $form['environment']['Environment_Container']['Air_Density'] = [
        '#type' => 'number',
        '#step'=>0.0001,
        '#min' => 0,
        '#max' => 2,
        '#title' => $this->t('Air Density [kg/m3]'),
		'#default_value' =>1.2041,
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id = "air_density"></div>',
    ];
    $form['environment']['Environment_Container']['Road_Slope'] = [
        '#type' => 'number',
        '#step'=> 0.1,
        '#min' => 0,
        '#max' => 45,
        '#title' => $this->t('Road Slope [°]'),
		'#default_value' => 0.0,
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id = "road_slope"></div>',
    ];
    $form['vehicle']['Vehicle_Container'] = [
        '#type'=>'fieldset',
    ];
    $form['vehicle']['Vehicle_Container']['Vehicle_Mass'] = [
        '#type' => 'number',
        '#step'=> 50,
        '#min' => 100,
        '#max' => 50000,
        '#title' => $this->t('Vehicle Mass <output class="badge bg-secondary"></output>[kg]'),
		'#default_value' => 2000,
        '#prefix' => '<div class="row align-items-start p-auto"><div class="col border-end">',
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id="vehicle_mass"></div>',
    ];
    $form['vehicle']['Vehicle_Container']['Frontal_Area'] = [
        '#type' => 'number',
        '#step'=> 0.01,
        '#min' => 0.1,
        '#max' => 10,
        '#title' => $this->t('Frontal Area [m2]'),
		'#default_value' => 2.5,
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id = "frontal_area"></div>',
    ];
    $form['vehicle']['Vehicle_Container']['Wheel_Radius'] = [
        '#type' => 'select',
        '#options' => $this->getWheelList(WHEEL_DB_NAME),
        '#empty_option' => $this->t('- Select a tyre size -'),
        '#default_value' => 370,
        '#title' => $this->t('Tyre Size'),
        '#suffix' => '</div>',
    ];
    $form['vehicle']['Vehicle_Container']['Rolling_Resistance'] = [
        '#type' => 'number',
        '#step'=> 0.001,
        '#min' => 0,
        '#max' => 1,
        '#title' => $this->t('Rolling Resistance [-]'),
		'#default_value' => 0.012,
        '#prefix' => '<div class="col">',
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id = "rolling_resitance"></div>',
    ];
	$form['vehicle']['Vehicle_Container']['Drag_Coefficient'] = [
        '#type' => 'number',
        '#step'=> 0.01,
        '#min' => 0,
        '#max' => 5,
        '#title' => $this->t('Aerodynamic Drag [-]'),
		'#default_value' => 0.35,
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id = "drag_coefficient"></div>',
    ];
	$form['vehicle']['Vehicle_Container']['Vehicle_Range'] = [
        '#type' => 'number',
        '#step'=>1,
        '#min' => 10,
        '#max' => 2000,
        '#default_value' => 400,
        '#title' => $this->t('Vehicle Range [km]'),
        '#suffix' => '<output class="badge bg-secondary"></output><div class="error" id="vehicle_range"></div></div>',
    ];
    $form['actions'] = [
		'#type' => 'actions',
	];
	$form['actions']['submit'] = [
		'#type' => 'button',
		'#value' => $this->t('save'),
        '#ajax' => [
            'callback' => '::submitData',
            'wrapper'=> 'Results',
            'disable-refocus' => TRUE,
            'progress' => [
              'type' => 'throbber',
              'message' => $this->t('Calculating entry...'),
            ]
        ]
	];
    $form['Results'] = [
        '#type' => 'container',
        '#markup' => '<div id="results" class="alert alert-primary">Battery Pack Size [kwh] here...</div>'
      ];

    $form['CalculatePackSize'] = [
        '#type' =>'button',
        '#value' => $this->t('Calculate Powertrain Requirements'),
        '#prefix' =>'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calculator" viewBox="0 0 16 16">
        <path d="M12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
        <path d="M4 2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>
      </svg>',
        '#attributes' => [ 'class' => ['btn', 'btn-primary', 'btn-lg'] ],
    ];
    $form['pack'] = [
        '#type' => 'details',
        '#title' => $this->t('Battery Pack Sizing Calculations'),
        '#attributes' => ['open' => true,
                        'id' => 'Pack_Container',
                        'class' => ['p-0', 'm-0',],
    ],
      ];
    $form['pack']['Pack_Energy_Container'] = [
        '#type' => 'fieldset',
        '#title' => $this->t('Pack Energy'),
        '#attributes' => ['id' => 'pack_energy_container' ],
    ];
    $form['pack']['Pack_Energy_Container']['Pack_Size'] = [
        '#type' => 'number',
        '#title' => $this->t('Pack Energy [kWh]'),
        '#default_value' => 85,
        '#suffix' => '<div class="error" id = "pack_energy"></div>'
    ];
    $form['pack']['Voltage_Architecture'] = [
        '#type' => 'radios',
        '#title' => $this->t('Voltage Architecture'),
        '#options' => [
            0 => $this->t('400V'),
            1 => $this->t('800V'),
        ],
        '#default_value' => 1,
    ];
    $form['pack']['Cell_DB'] = [
        '#title' => 'Lithium ion cell database <a href="https://github.com/TUMFTM/TechnoEconomicCellSelection" target="_blank">(source)</a>',
        '#type' => 'select',
        '#options' => $this->getCellList(CELL_DB_NAME),
        // '#empty_option' => $this->t('- Select a lithium ion cell -'),
        '#default_value' => 87,
        '#ajax' => [
            'callback' => '::updateCell',
            'wrapper' => 'cell-wrapper',
        ],
    ];
    $form['pack']['cell_wrapper'] = [
        '#type' => 'container',
        '#attributes' => [
            'id' => 'cell-wrapper',
            ],
    ];
    $cell = $form_state->getValue('Cell_DB');

    if ($cell == null) {
        $cell = 87;
    }
    if ($cell !=null) {
        $form['pack']['cell_wrapper']['Cell_Voltage_Nom'] = [
            '#type' => 'number',
            '#title' => $this->t('Nominal V [V]'),
            '#step' => 0.001,
            '#min' => 0.100,
            '#max' => 4,
            '#value' => (float) $this->getCell($cell, CELL_DB_NAME)['nom_v'],
            '#prefix' => '<div class="row align-items-start p-auto"><div class="col">'
        ];
        $form['pack']['cell_wrapper']['Cell_Voltage_Max'] = [
            '#type' => 'number',
            '#title' => $this->t('Max V [V]'),
            '#step' => 0.1,
            '#min' => 0.1,
            '#value' => (float) $this->getCell($cell, CELL_DB_NAME)['max_v'],
        ];
        $form['pack']['cell_wrapper']['Cell_Voltage_Min'] = [
            '#type' => 'number',
            '#title' => $this->t('Cut Off V [V]'),
            '#step' => 0.1,
            '#min' => 0.1,
            '#value' => (float) $this->getCell($cell, CELL_DB_NAME)['cutoff_v'],
        ];
        $form['pack']['cell_wrapper']['C_rate'] = [
            '#type'=> 'number',
            '#title' =>$this->t('C-rate'),
            '#step' => 1,
            '#min' => 1,
            '#max' => 100,
            '#value' => 10,
            '#suffix' => '<div class="error" id="c_rate"></div>',
        ];
        $form['pack']['cell_wrapper']['Width'] = [
            '#type' => 'number',
            '#title' => $this->t('Width [mm]'),
            '#step' => 0.1,
            '#min' => 0.0,
            '#value' => (float) $this->getCell($cell, CELL_DB_NAME)['width_mm'],
        ];
        $form['pack']['cell_wrapper']['Height'] = [
            '#type' => 'number',
            '#title' => $this->t('Height [mm]'),
            '#step' => 0.1,
            '#min' => 0.1,
            '#value' => (float) $this->getCell($cell, CELL_DB_NAME)['height_mm'],
            '#suffix' => '</div>'
        ];
        $form['pack']['cell_wrapper']['Depth'] = [
            '#type' => 'number',
            '#title' => $this->t('Depth or Dia [mm]'),
            '#step' => 0.1,
            '#min' => 0.1,
            '#value' => $this->getCell($cell, CELL_DB_NAME)['depth_mm'] == "not applicable" ?
            (float) $this->getCell($cell, CELL_DB_NAME)['dia_mm'] : (float) $this->getCell($cell, CELL_DB_NAME)['depth_mm'],
            '#prefix' => '<div class="col">',
        ];
        $form['pack']['cell_wrapper']['Diameter'] = [
            '#type' => 'hidden',
            '#title' => $this->t('Diameter [mm]'),
            '#step' => 0.1,
            '#min' => 0.1,
            '#value' => $this->getCell($cell, CELL_DB_NAME)['depth_mm'] == "not applicable" ?
            (float) $this->getCell($cell, CELL_DB_NAME)['dia_mm'] : (float) $this->getCell($cell, CELL_DB_NAME)['depth_mm'], //mm
        ];
        $form['pack']['cell_wrapper']['Cell_Capacity'] = [
            '#type' => 'number',
            '#title' => $this->t('Capacity [Ah]'),
            '#step' => 0.1,
            '#min' => 0.1,
            '#value' => (float) $this->getCell($cell, CELL_DB_NAME)['ah_rate'],
        ];
        $form['pack']['cell_wrapper']['Cell_Mass'] = [
            '#type' => 'number',
            '#title' => $this->t('Mass [g]'),
            '#step' => 1,
            '#min' => 1,
            '#value' => (float) $this->getCell($cell, CELL_DB_NAME)['mass_g'],
        ];
        $form['pack']['cell_wrapper']['Cell_Tab_Resistance'] = [ //[mOhm]
            '#type' => 'number',
            '#title' => $this->t('Tab R [mOhm]'),
            '#step'=> 0.0001,
            '#min' => 0.0001,
            '#default_value' => 0.0030,
            '#suffix' => '<div class="error" id = "cell_tab_resistance"></div>'
        ];
        $form['pack']['cell_wrapper']['Cell_Internal_Resistance'] = [ //[Ohm]
            '#type' => 'number',
            '#title' => $this->t('Internal R [Ohm]'),
            '#step'=> 0.001,
            '#min' => 0.001,
            '#default_value' => 0.014,
            '#suffix' => '<div class="error" id = "cell_internal_resistance"></div>'
        ];
        $form['pack']['cell_wrapper']['EE_Internal_Resistance'] = [ //[Ohm]
            '#type' => 'number',
            '#title' => $this->t('EE internal R [mOhm]'),
            '#step'=> 0.1,
            '#min' => 0.1,
            '#default_value' => 5,
            '#suffix' => '<div class="error" id = "ee_internal_resistance"></div></div>'
        ];
    }
    $form['PlotlyBattDB'] =  [
        '#type' => 'markup',
        '#markup' => '<div id = "battPlotDB"></div>',
            '#allowed_tags' => ['canvas', 'button','span','svg', 'path', 'div'],  
        ];
    $form['PackParameters'] = [
        '#type' => 'container',
        '#markup' => '<div id="packParameters" class="alert alert-primary">Battery Pack Specifications here...</div>'
        ];
    $form['CalculatePackParameters'] = [
        '#type' =>'button',
        '#value' => $this->t('Calculate Pack Parameters'),
        '#attributes' => ['class' => ['btn', 'btn-primary']],
        '#ajax' => [
            'callback' => '::batteryPackParameters',
            'wrapper'=> 'packParameters',
            'disable-refocus' => TRUE,
            'progress' => [
              'type' => 'throbber',
              'message' => $this->t('Calculating entry...'),
            ]
        ]
    ];
    $form['#attached']['library'][] = 'batterycalc/chart_library';

    $form['#theme'] = 'batterycalc_form';

    return $form;
 }

public function selectCycle($form, FormStateInterface $form_state) {
    // one way to return a form element
    $ajax_response = new AjaxResponse();
    return $ajax_response->addCommand(new ReplaceCommand('#Speed_Container', $form['Speed_Container']));
}

public function motorConfiguration($form, FormStateInterface $form_state) {
    return $form['powertrain']['Powertrain_Container']['Motor'];
}

public function cellGeometryParameters($form, FormStateInterface $form_state) {
    // other way to return a form element
    return $form['pack']['Cell_Geom_Container']['Geometry'];
}

public function batteryPackParameters($form, FormStateInterface $form_state) {
    $ajax_response = new AjaxResponse();
    //get values
    $formField = $form_state->getValues();
    
    $cell = $form_state->getValue('Cell_DB');
    
    if ($cell != null){
    $packEnergy = $formField['Pack_Size'];

    
    switch ($formField['Voltage_Architecture']){
        case 0:
            $packVoltage = 400;
            break;
        case 1:
            $packVoltage = 800;
            break;
        default:
            $packVoltage = 400;
            break;        
        }      
            
            $c_rate = $formField['C_rate'];
            $cellMass = $formField['Cell_Mass']; //[g]
            $cellCapacity = $formField['Cell_Capacity']; //[Ah]
            $cellVoltage = $formField['Cell_Voltage_Nom']; //[V]
            $cellHeight = $formField['Height']; //[mm]
            
            $CellTabResistance = $formField['Cell_Tab_Resistance'];
            $CellInternalResitance = $formField['Cell_Internal_Resistance'];
            $EEInternalResistance = $formField['EE_Internal_Resistance'];

            if ($formField['Width'] != 0) {
                    $cellWidth = $formField['Width'];
                    $cellDepth = $formField['Depth'];
                    $cellVolume = round($cellHeight * $cellWidth * $cellDepth * 10 ** -3,3); // [cm3]
            }
            else {
                $cellDiameter = $formField['Diameter'];
                $cellVolume = round(M_PI * $cellDiameter ** 2 * $cellHeight/ 4 * 10 ** -3,3); // [cm3]
            }

            $cellEnergy = round($cellCapacity * $cellVoltage,1); // [Wh]
            $cellSpecificEnergyDensity = round($cellEnergy * 1000 / $cellMass); // [Wh/kg]
            $cellVolumicEnergyDensity = round($cellEnergy * 1000 / ($cellVolume),2); // [Wh/cm3]

            $numCellsInSeries = ceil($packVoltage/$cellVoltage);
            $numStringsInParallel = ceil(($packEnergy*1000/$packVoltage)/($cellCapacity));

            $packResistance = round( ($CellInternalResitance * 1000 + $CellTabResistance) / $numStringsInParallel * $numCellsInSeries
                              + ($EEInternalResistance), 3);

            $revisedPackSize = $numStringsInParallel * $packVoltage  * $cellCapacity * 10 ** -3; // [kWh]
            $revisedPackCapacity = $revisedPackSize * 1000 / $packVoltage; // [Ah]
            $totalNumberOfCells = $numCellsInSeries * $numStringsInParallel;
            $packMass = $totalNumberOfCells * $cellMass / 1000; // [kg]
            $packVolume = round($totalNumberOfCells * $cellVolume * 10 ** -3,2); // [dm3]

            $current = $numStringsInParallel * $c_rate * $cellCapacity ;

            $power = $current * $packVoltage / 1000;

            $text = $this->t('<div class="card-group">
            <div class="card alert alert-primary">
            <h5 class="card-header alert alert-warning text-center mt-0 fs-4 fw-bold">Cell Specification</h5>
                <div class="card-body">'.$this->getCellSpec($cell, CELL_DB_NAME).'

                </div>
            </div>
            <div class="card alert alert-primary">
            <h5 class="card-header alert alert-warning text-center mt-0 fs-4 fw-bold">Battery Pack Specification</h5>
                <div class="card-body alert">
                <p class="card-text m-0">Pack capacity: @revised_pack_capacity Ah</p>
                <p class="card-text m-0">Pack energy: @revised_pack_size kWh</p>
                <p class="card-text m-0">Pack S/P (series/parallel): @number_of_cells_in_series/@number_of_strings_in_parallel</p>
                <p class="card-text m-0">Number of cells in the pack: @total_number_of_cells</p>
                <p class="card-text m-0">Pack resistance: @packResitance mOhm</p>
                <p class="card-text m-0">Pack mass: @pack_mass kg</p>
                <p class="card-text m-0">Pack volume: @pack_volume L</p>
                <p class="card-text m-0">The current draw at a @c_rate C is @current A</p>
                <p class="card-text m-0">The power delivered at @c_rate C is @power kW</p>
                </div>
            </div>
        </div>'
        ,[
            '@cell_volume' => $cellVolume,
            '@cell_energy' => $cellEnergy,
            '@specific_energy_density' => $cellSpecificEnergyDensity,
            '@volumetric_energy_density' => $cellVolumicEnergyDensity,
            '@number_of_cells_in_series' => $numCellsInSeries,
            '@number_of_strings_in_parallel' => $numStringsInParallel,
            '@revised_pack_capacity' => $revisedPackCapacity,
            '@revised_pack_size' => $revisedPackSize,
            '@total_number_of_cells' => $totalNumberOfCells,
            '@packResitance' => $packResistance,
            '@pack_mass' => $packMass,
            '@pack_volume' => $packVolume,
            '@c_rate' => $c_rate,
            '@current' => $current,
            '@power' => $power,
        ]);

    //    $cycle_power = $this->total_cycle_power($form,$form_state);

    } else {
        $text = "Battery Pack Specifications here... Select a cell first! in Battery Pack Sizing Calculations";
    }

    $ajax_response->addCommand(new HtmlCommand('#packParameters', $text));


    return $ajax_response;
}

/**
* @param array $form
* this form
* @param FromStateInterface $form_state
* the variable that holds the state of this form
* 
* @return array
* an array of speed values second by second.
*/
public function speed_array(array $form, FormStateInterface $form_state){
    return array_map(function($v){return $v / 3.6;},
        array_map('floatval', explode(",",
        (string)$form_state->getValue('Vehicle_Speed')))); //speed in m/s
}

/**
 * calculates the total forces for each speed in the array
 * 
 * @param array $form
 * this form
 * @param FromStateInterface $form_state
 * the variable that holds the state of this form
 *
 * @return array
 * an array of power values second by second.
 *  
 */
public function total_forces($form, FormStateInterface $form_state){
    $speed = $this->speed_array($form, $form_state);
    $mass = $form_state->getValue('Vehicle_Mass');
    $alpha = $form_state->getValue('Road_Slope')*M_PI/180;
    $rr = $form_state->getValue('Rolling_Resistance');
    $Cd = $form_state->getValue('Drag_Coefficient');
    $rho = $form_state->getValue('Air_Density');
    $A = $form_state->getValue('Frontal_Area');
    $dt = 1; //time step, 1sec

    $total_forces = [];

    foreach ($speed as $k => $v) {
        $total_forces[] = $mass * (($v - ( ($k-1) < 0 ? 0 : $speed[$k-1])) 
                + GRAVITY * $rr * cos($alpha) 
                + GRAVITY * sin($alpha))
                + 0.5 * $rho * $Cd * $A * $v * $v;
    }

    return $total_forces;
}
public function total_cycle_power($form, FormStateInterface $form_state){
    $speed = $this->speed_array($form, $form_state);
    $forces = $this->total_forces($form, $form_state);

    return array_map(function($f, $s){
        return $f * $s / 1000; //kW
    }, $forces, $speed);
}
public function motor_power_available_continuous($form, FormStateInterface $form_state){
    return ( $form_state->getValue('Front_Motor_Power_Continuous') ?? 0 ) 
         + (  $form_state->getValue('Rear_Motor_Power_Continuous') ?? 0 );
}
public function motor_power_available_peak($form, FormStateInterface $form_state){
    return ( $form_state->getValue('Front_Motor_Power_Peak') ?? 0 ) 
         + ( $form_state->getValue('Rear_Motor_Power_Peak') ?? 0 );
}
public function motor_power_actual_continuous($form, FormStateInterface $form_state){
    $power_dmnd = $this->total_cycle_power($form, $form_state);
    $motorPower = $this->motor_power_available_continuous($form, $form_state);

    $eff = $form_state->getValue('Powertrain_Efficiency');
    $regen = $form_state->getValue('Regen_Capacity') / 100;

    return array_map(function($p) use ($eff, $motorPower, $regen){
        if ($p / $eff >= $motorPower){
            return $motorPower;
        }
        if ($p / $eff < -$motorPower * $regen){
            return -$motorPower * $regen;
        }
        return $p / $eff;
    }, $power_dmnd);
}
public function motor_power_actual_peak($form, FormStateInterface $form_state){
    $power_dmnd = $this->total_cycle_power($form, $form_state);
    $motorPower = $this->motor_power_available_peak($form, $form_state);

    $eff = $form_state->getValue('Powertrain_Efficiency');
    $regen = $form_state->getValue('Regen_Capacity') / 100;

    return array_map(function($p){

        if ($p / $eff >= $motorPower){
            return $motorPower;
        }
        if ($p / $eff < -$motorPower * $regen){
            return -$motorPower * $regen;
        }
        return $p / $eff;
    }, $power_dmnd);
}
/**
 * 
 * cycle energy with regen
 * 
 * @param array $form
 * this form
 * @param FromStateInterface $form_state
 * the variable that holds the state of this form
 * 
 * @return array
 * an array of cycle power demand values second by second.
 */
public function cycle_energy_regen_on($form, FormStateInterface $form_state){

    $regen = $form_state->getValue('Regen_Capacity') / 100 ;
    $actual_power = $this->motor_power_actual_continuous($form, $form_state);
    
    $total = 0;
    return array_map(function($v) use(&$total, $regen){
         return $total += ( ($v >= 0) ? $v : $v * $regen ) / 3600;        
    }, $actual_power);

}

/**
 * cycle energy without regen
 * 
 * 
 * 
 */
public function cycle_energy_regen_off($form, FormStateInterface $form_state){
    $power_dmnd = $this->total_cycle_power($form, $form_state);

    $total = 0;
    return array_map(function($v) use(&$total){
        return $total += $v / 3600;        
    }, $power_dmnd);
}

/**
 * Energy consumption[kwh/km]
 * 
 * @param array $form
 * this form
 * @param FromStateInterface $form_state
 * the variable that holds the state of this form
 * 
 * @return array
 * an array of power values second by second.
 */
public function energy_per_km($form, FormStateInterface $form_state){
    $ajax_response = new AjaxResponse();
    $formField = $form_state->getValues();

    $speed = $this->speed_array($form, $form_state);
    $distance = array_sum($speed) / 1000; 
    $range = $formField['Vehicle_Range'];
    $useable_capacity = $formField['Useable_Capacity'] / 100;
    $regen_capacity = $formField['Regen_Capacity'] / 100;

    $efficiency = $formField['Powertrain_Efficiency'];
    $ancillary_energy_per_km = $formField['Ancillary_Energy'];

    // vehicle Motor Power [kW]
    $motor_power_continuous = $formField['Front_Motor_Power_Continuous'] ?? 0 
                            + $formField['Rear_Motor_Power_Continuous'] ?? 0;

    $motor_power_peak = $formField['Front_Motor_Power_Peak'] ?? 0 
                      + $formField['Rear_Motor_Power_Peak'] ?? 0;

    // Regen Power [kW]
    $regen_continuous = $regen_capacity * $motor_power_continuous;
    $regen_peak = $regen_capacity * $motor_power_peak;

    $energy_per_km = (array_sum($this->cycle_energy_regen_on($form, $form_state))
                    / $distance + $ancillary_energy_per_km)
                    / $efficiency; // [wh/km]

    $packEnergy = round($energy_per_km * $range / $useable_capacity / 1000, 2); //[kwh]

    $text = $this->t('<i>The energy requirement of this vehicle is @efficiency Wh/km or @efficiency2 mi/kWh.
                      To achieve a range of @range km or @range_mi miles on the cycle this vehicle requires a battery of @batterySize kWh 
                      if @useable_capacity% of the battery capacity is useable.',
                    [
                    '@efficiency' => round($energy_per_km, 2),
                    '@efficiency2' => round(1000/$energy_per_km/1.609, 2),
                    '@batterySize' =>round($packEnergy, 2),
                    '@range' => round($range, 2),
                    '@range_mi' => round($range / 1.609, 1),
                    '@useable_capacity' => $useable_capacity * 100
                    ]);

    $ajax_response->addCommand(new HtmlCommand('#results', $text));
    $ajax_response->addCommand(new InvokeCommand('#pack_energy_container', 'val', [$packEnergy]));
    
    return $ajax_response;
}

public function getWheelList($dbname){
    $file_path = \Drupal::service('extension.list.module')->getPath('batterycalc') . '/assets/'. $dbname;   
    $handle = fopen($file_path, "r");

    $wheel_list = [];
    if ($handle) {
        while (($line = fgets($handle)) !== false) {
            $wheel_list[] = $line;
        }

    fclose($handle);
    }
    return $wheel_list;
}

/**
 * Returns a list of cells in the database file.
 * 
 *  @param string $db_name
 *  The cell database file name located in ../assets folder
 *
 * @return array
 *   An associative array cells data from a database file.
 */
protected function getCellDB($dbname){
    $file_path = \Drupal::service('extension.list.module')->getPath('batterycalc') . '/assets/'. $dbname;    
    $result = file_get_contents($file_path);
    return json_decode($result, true);
}

protected function getCellOption($cell_index,$dbname){
    return $this->getCell($cell_index, $dbname);
}
/**
 * Returns a list of cells.
 *
 * @return array
 *   An associative array of formatted cells data.
 */
protected function getCellList($dbname){
    return array_map(function($v){return $v['ffactor'] . ' ' .  $v['prt_num'] . ' ' . $v['brand'] . ' ' 
                                                . $v['chemistry'] . ' '
                                                . $v['ah_rate'] . 'Ah nom '
                                                . $v['nom_v'] . 'V max ' . $v['max_v'] . 'V min '
                                                . $v['cutoff_v'] .'V';
                                            }, 
                                                $this->getCellDB($dbname)
                                            );
                                        }
/**
 * Returns cell specification that correspond with the cell index.
 *
 * @param integer $cell
 *   The index value of the cell data in the cell database
 *
 * @return array
 *   An associative array of cell technical data.
 */

protected function getCell($cell_index, $dbname) {
    return $this->getCellDB($dbname)[$cell_index];
}

protected function getCellSpec($cell, $dbname) {
    $cell_spec = $this->getCell($cell, CELL_DB_NAME);

    $cell_text = '';
    foreach ($cell_spec as $key => $value) {
       $cell_text = $cell_text . '<p class="card-text m-0">'. $key . ': ' . $value . '</p>';
    }

    return $cell_text;
}

/**
 * Ajax callback for the cell list dropdown.
 */
public function updateCell(array $form, FormStateInterface $form_state){
    $ajax_response = new AjaxResponse();
    // $ajax_response->addCommand(new HtmlCommand('#packParameters', 'Battery Pack Specifications here...'));
    $ajax_response->addCommand(new ReplaceCommand('#cell-wrapper', $form['pack']['cell_wrapper']));
    // $ajax_response = array_merge($ajax_reponse, $this->batteryPackParameters($form, $form_state));

    return $ajax_response;
}

 public function submitData(array &$form, FormStateInterface $form_state){
    $ajax_response = new AjaxResponse();
    $conn = Database::getConnection();

    $formField = $form_state->getValues();

    $flag = TRUE;
    if(trim($formField['Batt_Title']) == ''){
        return $ajax_response->addCommand(new HtmlCommand('#batt_title', 'Please enter the project title.'));
        $flag = FALSE;
    }
    if(trim($formField['Vehicle_Speed']) == ''){
        return $ajax_response->addCommand(new HtmlCommand('#vehicle_speed_error', 'Please enter the vehicle speed profile.'));
        $flag = FALSE;
    }
    if(trim($formField['Vehicle_Mass']) == ''){
        return $ajax_response->addCommand(new HtmlCommand('#vehicle_mass', 'Please enter the vehicle mass'));
        $flag = FALSE;
    }
    if(trim($formField['Frontal_Area']) == ''){
        return $ajax_response->addCommand(new HtmlCommand('#frontal_area', 'Please enter the frontal area'));
        $flag = FALSE;
    }
    if(trim($formField['Air_Density']) == ''){
        return $ajax_response->addCommand(new HtmlCommand('#air-density', 'Please enter the air density'));
        $flag = FALSE;
    }
    if(trim($formField['Road_Slope']) == ''){
        return $ajax_response->addCommand(new HtmlCommand('#road_slope', 'Please enter the road slope'));
        $flag = FALSE;
    }
    if(trim($formField['Rolling_Resistance']) == ''){
        return $ajax_response->addCommand(new HtmlCommand('#rolling_resistance', 'Please enter the rolling resistance'));
        $flag = FALSE;
    }
    if(trim($formField['Drag_Coefficient']) == ''){
        return $ajax_response->addCommand(new HtmlCommand('#drag_coefficient', 'Please enter the drag coefficient'));
        $flag = FALSE;
    }
    if(trim($formField['Powertrain_Efficiency']) == ''){
        return $ajax_response->addCommand(new HtmlCommand('#powertrain_efficiency', 'Please enter the rolling resistance'));
        $flag = FALSE;
    }
    if(trim($formField['Ancillary_Energy']) == ''){
        return $ajax_response->addCommand(new HtmlCommand('#ancillary_energy', 'Please enter the drag coefficient'));
        $flag = FALSE;
    }

    if ($flag){
        $formData['Batt_Title'] = $formField['Batt_Title'];
        $formData['Vehicle_Speed'] = $formField['Vehicle_Speed'];
        $formData['Vehicle_Mass'] = $formField['Vehicle_Mass'];
        $formData['Frontal_Area'] = $formField['Frontal_Area'];
        $formData['Air_Density'] = $formField['Air_Density'];
        $formData['Road_Slope'] = $formField['Road_Slope'];
        $formData['Rolling_Resistance'] = $formField['Rolling_Resistance'];
        $formData['Drag_Coefficient'] = $formField['Drag_Coefficient'];
        $formData['Batt_Comment'] = $formField['Batt_Comment'];

        $conn->insert('batterycalc')
            ->fields($formData)
            ->execute();
        }

    return $this->energy_per_km($form, $form_state);    
} 

/**
 * {@inheritdoc}
*/
public function validateForm(array &$form, FormStateInterface $form_state) {
    // $this->calculateSpeedStatistics($form, $form_state);
	// 	$formField = $form_state ->getValues();
        

        // $vehicleSpeed = trim($formField['Vehicle_Speed']);
        // $vehicleMass = trim($formField['Vehicle_Mass']);
        // $frontalArea = trim($formField['Frontal_Area']);
        // $airDensity = trim($formField['Air_Density']);
        // $roadSlope = trim($formField['Road_Slope']);
        // $rollingResistance = trim($formField['Rolling_Resistance']);
        // $dragCoefficient = trim($formField['Drag_Coefficient']);
        // $cellVoltage = trim($formField['Cell_Voltage']);
        // $cellCapacity = trim($formField['Cell_Capacity']);
        // $cellMass = trim($formField['Cell_Mass']);
        // $cRate = trim($formField['C_rate']);

        // if(!preg_match("/^(\d*\.?\d+? ?,*)+/",$vehicleSpeed)){
        //     $form_state->setErrorByName('Vehicle_Speed',$this->t('Enter comma separated values for the vehicle speed'));
        // }
        // if(!preg_match("/^(\d+\.?\d*)/",$vehicleMass)){
        //     $form_state->setErrorByName('Vehicle_Mass',$this->t('Enter a decimal value'));
        // }
        // if(!preg_match("/^(\d+\.?\d*)/",$frontalArea)){
        //     $form_state->setErrorByName('Frontal_Area',$this->t('Enter a decimal value'));
        // }
        // if(!preg_match("/^(\d+\.?\d*)/",$airDensity)){
        //     $form_state->setErrorByName('Air_Density',$this->t('Enter a decimal value'));
        // }
        // if(!preg_match("/^(\d+\.?\d*)/",$roadSlope)){
        //     $form_state->setErrorByName('Road_Slope',$this->t('Enter a decimal value'));
        // }
        // if(!preg_match("/^(\d+\.?\d*)/",$rollingResistance)){
        //     $form_state->setErrorByName('Rolling Resistance',$this->t('Enter a decimal value'));
        // }
        // if(!preg_match("/^(\d+\.?\d*)/",$dragCoefficient)){
        //     $form_state->setErrorByName('Drag_Coefficient',$this->t('Enter a decimal value'));
        // }
        // if(!preg_match("/^(\d+\.?\d*)/",$cellVoltage)){
        //     $form_state->setErrorByName('Cell_Voltage',$this->t('Enter a decimal value'));
        // }
        // if(!preg_match("/^(\d+\.?\d*)/",$cellCapacity)){
        //     $form_state->setErrorByName('Cell_Capacity',$this->t('Enter a decimal value'));
        // }
        // if(!preg_match("/^(\d+\.?\d*)/",$cellMass)){
        //     $form_state->setErrorByName('Cell_Mass',$this->t('Enter a decimal value'));
        // }
        // if(!preg_match("/^(\d+\.?\d*)/",$cRate)){
        //     $form_state->setErrorByName('C_rate',$this->t('Enter a decimal value'));
        // }
    } 
/**
 * {@inheritdoc}
*/ 
public function submitForm(array &$form, FormStateInterface $form_state){

}

/**
 * inertial force
 * m * a
 */
public function inertial_energy(array &$form, FormStateInterface $form_state){
    $formField = $form_state->getValues();
    $speed = $this->speed_array($form, $form_state);
    $mass = $formField['Vehicle_Mass'];
    $dt = 1;
    $energy = [];

    for ($i = 0; $i < count($speed)-1; $i++) {
        array_push($energy, $mass * ($speed[$i+1] - $speed[$i]) / $dt * 1000/3600 * $speed[$i+1] * 1000/3600 * $dt / 3600 );
    }

    return $energy;   //[Wh]
}

/**
 *  road load
 * m * g * Cr *cos(alpha) + m * g * sin(alpha)
*/
public function road_load_energy(array &$form, FormStateInterface $form_state){
    $formField = $form_state->getValues();
    $speed = $this->speed_array($form, $form_state);
    $mass = $formField['Vehicle_Mass'];
    $alpha = $formField['Road_Slope']*M_PI/180;
    $rr = $formField['Rolling_Resistance'];
    $dt = 1; //time step, 1sec
    $energy = [];

    for ($i = 0; $i < count($speed); $i++){
        array_push($energy, $mass * GRAVITY * ($rr * cos($alpha) + sin($alpha) )
                 * $speed[$i]*1000/3600 
                 * $dt / 3600);
    }

    return $energy;  //[wh]
}

/**
 * aerodynamic drag force
 * 0.5 * rho * Cd * A * v^2
 */
public function aero_drag_energy(array &$form, FormStateInterface $form_state){
    $formField = $form_state->getValues();
    $speed = $this->speed_array($form, $form_state);
    $Cd = $formField['Drag_Coefficient'];
    $rho = $formField['Air_Density'];
    $frontalArea = $formField['Frontal_Area'];
    $dt = 1;
    $energy = [];

    for ($i = 0; $i < count($speed); $i++){
        array_push($energy, 0.5 * $rho *  $Cd * $frontalArea * pow($speed[$i]*1000/3600,2) * $speed[$i] * 1000 / 3600 * $dt / 3600 );
    }
    return $energy;  //[wh]
}



}