<?php
/**
 * Plugin Name: Adrian's Family Tipping Comp
 * Description: AFL Tipping app with cloud sync for the 2026 season. Use shortcode [adrians_tipping]
 * Version: 3.2.0
 * Author: Adrian
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// 1. Create the Shortcode [adrians_tipping]
add_shortcode('adrians_tipping', function() {
    $plugin_url = plugin_dir_url(__FILE__);
    $rest_url = get_rest_url();
    // Pass the rest URL as a parameter to the iframe
    $iframe_src = add_query_arg('wp_rest', esc_url($rest_url), $plugin_url . 'index.html');
    
    ob_start();
    ?>
    <div id="adrian-tipping-wrapper" style="width:100%; height:850px; max-height:90vh; margin:20px 0; border-radius:24px; overflow:hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); background: #020617;">
        <iframe 
            src="<?php echo $iframe_src; ?>" 
            style="width: 100%; height: 100%; border: none; display: block;"
            allow="clipboard-write"
        ></iframe>
    </div>
    <style>
        /* Force WP themes to give us space */
        .entry-content { max-width: none !important; }
        .post-inner { max-width: none !important; }
    </style>
    <?php
    return ob_get_clean();
});

// 2. REST API Endpoints for syncing tips to the WP Database
add_action('rest_api_init', function () {
    register_rest_route('adrians-tipping/v1', '/users', array(
        'methods' => 'GET',
        'callback' => function() {
            $data = get_option('adrians_tipping_v3_data');
            return $data ? json_decode($data) : null;
        },
        'permission_callback' => '__return_true'
    ));

    register_rest_route('adrians-tipping/v1', '/sync', array(
        'methods' => 'POST',
        'callback' => function($request) {
            $params = $request->get_json_params();
            if (empty($params)) return new WP_Error('no_data', 'No data', array('status' => 400));
            update_option('adrians_tipping_v3_data', json_encode($params));
            return array('success' => true);
        },
        'permission_callback' => '__return_true'
    ));
});
?>