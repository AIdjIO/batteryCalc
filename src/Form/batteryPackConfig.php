<?php

namespace Drupal\batterycalc\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\AppendCommand;
use Drupal\Core\Ajax\AfterCommand;
use Drupal\Core\Ajax\InvokeCommand;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Database\Database;

/**
 * Provides a battery pack calculation form.
 */
 class batteryPackConfig extends FormBase {
/**
 * {@inheritdoc}
 */
 public function getFormId() {
    return 'batteryPackConfig_ajax';
 }
 
 /**
  * {@inheritdoc}
  */
 public function buildForm(array $form, FormStateInterface $form_state) {
    $form['Cell_Container'] = [
        '#type' => 'fieldset',
        '#attributes'=>[
            'class' => 'form-control form-control-sm',
        ]
    ];
    $form['Cell_Container']['Cell_Geometry'] = [
        '#type' => 'select',
        '#options' => [
            'Choose' => 'Choose Geometry',
            'cylindrical' => 'Cylindrical',
            'prismatic' => 'Prismatic',
            'pouch' => 'Pouch'
        ],
        '#default_value' => 'choose',
        '#ajax' => [
            'callback' => '::cellGeometryParameters',
            'event' => 'change',
            'wrapper' => 'geometry-container',
            'effect' => 'fade',
        ]
    ];
    $form['Geometry']=[
        '#type' => 'container',
        '#attributes' => ['id' => 'geometry-container'],
    ];
    $form['Cell_Voltage'] = [ //[V]
        '#type' => 'number',
        '#title' => $this->t('Cell Voltage'),
        '#required' => TRUE,
        '#default_value' => '3.3',
        '#suffix' => '<div class="error" id = "cell_voltage"></div>'
    ];
    $form['Cell_Capacity'] = [ // [Ah]
        '#type' => 'number',
        '#title' => $this->t('Cell Capacity'),
        '#required' => TRUE,
		'#default_value' => '2.5', //[Ah]
        '#id' => 'cell_capacity',
        '#suffix' => '<div class="error" id="cell_capacity"></div>',
    ];
    $form['Cell_Mass'] = [ // [Ah]
        '#type' => 'number',
        '#title' => $this->t('Cell Mass'),
        '#required' => TRUE,
		'#default_value' => 7.6, //[g]
        '#id' => 'cell_mass',
        '#suffix' => '<div class="error" id="cell_capacity"></div>',
    ];

    switch ($form_state->getValue('Cell_Geometry')) {
        case 'Cylindrical':
            $form['Geometry']['Diameter'] = [
                '#type' => 'number',
                '#title' => $this->t('Diameter'),
                '#required' => 'TRUE',
                '#default' => 26, //mm
                '#prefix' => '<div class="col">',
                '#suffix' => '</div>',
            ];
            $form['Geometry']['Height'] = [
                '#type' => 'number',
                '#title' => $this->t('Height'),
                '#required' => 'TRUE',
                '#default' => 65, //mm
                '#prefix' => '<div class="col">',
                '#suffix' => '</div>',
            ];
            break;
        case 'Prismatic':
        case 'Pouch':
            $form['Geometry']['Width'] = [
                '#type' => 'number',
                '#title' => $this->t('Width'),
                '#required' => 'TRUE',
                '#default' => 160, //mm
                '#prefix' => '<div class="col">',
                '#suffix' => '</div>',
            ];
            $form['Geometry']['Height'] = [
                '#type' => 'number',
                '#title' => $this->t('Height'),
                '#required' => 'TRUE',
                '#default' => 227, //mm
                '#prefix' => '<div class="col">',
                '#suffix' => '</div>',
            ];
            $form['Geometry']['Depth'] = [
                '#type' => 'number',
                '#title' => $this->t('Depth'),
                '#required' => 'TRUE',
                '#default' => 7.25, //mm
                '#prefix' => '<div class="col">',
                '#suffix' => '</div>',
            ];
            break;
        default:
            break;
    }
  
	return $form;
}

public function cellGeometryParameters($form, FormStateInterface $form_state) {
    $form_state->setRebuild(TRUE);
    return $form['Geometry'];
}
/**
 * {@inheritdoc}
 */
public function validateForm(array &$form, FormStateInterface $form_state) {

    $this->messenger()->addStatus($this->t('Your phone number is validate' ));
}

  /**
 * {@inheritdoc}
 */
public function submitForm(array &$form, FormStateInterface $form_state) {

    $this->messenger()->addStatus($this->t('Your phone number is submit' ));
  }

}