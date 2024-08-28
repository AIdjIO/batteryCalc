(function($, Drupal, drupalSettings){
    'use strict';
    $(document).ready(function(){
        $('input').on('focus', function(){
            $(this).parent().next('.error').text('');
        });
    });
});