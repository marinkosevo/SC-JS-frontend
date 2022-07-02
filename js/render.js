/*! render.js Build 20210314 | (c) ServersCheck and other contributors */
/*! Copyright footer must remain visible at all times. These sources may not be distributed in any format in any way. */

var scripts = document.getElementsByTagName("script");
var path = scripts[1].src.substring(0, scripts[1].src.lastIndexOf("/") - 2);
var change_sensor_name = 0;
var disable_mqtt = 1;
if (change_sensor_name == 0) var change_name = "disabled";
else var change_name = "";

$.getScript(path + "js/multi-range.js");
$.getScript(path + "js/bootstrap.min.js");
$.getScript("js/login.js");
$("head").append(
  $('<link rel="stylesheet" type="text/css" />').attr(
    "href",
    path + "css/multirange.css"
  )
);
$("head").append(
  $('<link rel="stylesheet" type="text/css" />').attr(
    "href",
    path + "css/bootstrap.min.css"
  )
);
$("head").append(
  $('<link rel="stylesheet" type="text/css" />').attr(
    "href",
    path + "css/full.css"
  )
);
function render(args) {
  var scripts = document.getElementsByTagName("script");
  var path = scripts[1].src.substring(0, scripts[1].src.lastIndexOf("/") - 2);

  $("#loader").append(
    '<div class="inner"><img id="black_arrows" src="' +
      path +
      'images/arrows_black.svg"><img id="white_arrows" src="' +
      path +
      'images/arrows.svg"></div>'
  );
  $("#navbar").addClass("navbar navbar-expand-lg");
  $("#navbar").append(
    `
		<a class='navbar-brand' href='/config.shtml'>
		<img src='` +
      path +
      `images/logo_serverscheck.svg' alt='ServersCheck Logo' border='0'>
		</a>
		<button class='navbar-toggler collapsed' type='button' data-toggle='collapse' data-target='#navbarSupportedContent' aria-controls='navbarSupportedContent' aria-expanded='false' aria-label='Toggle navigation'>
		<span class='navbar-toggler-icon'></span>
		</button>
		<div class='navbar-collapse collapse' id='navbarSupportedContent' style=''>
		<ul class='navbar-nav ml-auto'>
			<li class='nav-item'> 
			<a class='nav-link' href='/sensors.shtml'> 
				Sensors 
			</a> 
			</li>
			<li class='nav-item dropdown'>
			<a class="nav-link dropdown-toggle" href="#" id="config_dropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
				Configuration
				</a>
			<div class='dropdown-menu' aria-labelledby='config_dropdown'>
				<a class='dropdown-item' href='/config.shtml'>Main settings</a> 
				<a class='dropdown-item' href='/mqtt.shtml'>MQTT</a> 
				<a class='dropdown-item' href='/maintenance.shtml'>Maintenance</a> 
				<a class='dropdown-item' onclick="logout()" style='cursor:pointer;'>Logout</a> 
				<a class='dropdown-item'><label for="theme_switch">Dark theme</label>
				<br>
				<label class="switch">
					<input id="theme_switch" name="theme_switch" type="checkbox">
					<span class="slider round" ></span>
				</label></a> 
			</div>
			</li>
		</ul>
		</div>`
  );

  if (
    (window.matchMedia("(prefers-color-scheme: dark)").matches &&
      localStorage.getItem("servercheck_theme") != "light") ||
    localStorage.getItem("servercheck_theme") == "dark"
  ) {
    $("#theme_switch").click();
  }
  var path = "";
  switch (args.uri) {
    case "/config.shtml":
      path = "main-config.json";
      break;
    case "/mqtt.shtml":
      path = "main-config.json";
      break;
    case "/sensors.shtml":
      path = "probe-list.json";
      break;
    case "/maintenance.shtml":
      path = "info.json";
      break;
    default:
      location.replace("/config.shtml");
  }
  $.ajax({
    url: window.location.origin + "/" + path,
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "Basic " + "KD5fPCk6KC1fLSl6eno=");
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    type: "GET",
    dataType: "json",
    data: {},
    success: function (result) {
      $("#loader").hide();
      var template = create_template(args.uri, result);
      $("content").append(template);
      if (args.uri == "/config.shtml") {
        $.ajax({
          url: window.location.origin + "/info.json",
          beforeSend: function (xhr) {
            xhr.setRequestHeader(
              "Authorization",
              "Basic " + "KD5fPCk6KC1fLSl6eno="
            );
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          type: "GET",
          dataType: "json",
          data: {},
          success: function (result) {
            var time = result.time.local;
            var date = new Date(time * 1000);
            $("#hidden_clock").val(time * 1000);
            startTime();
            const monthNames = [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ];
            $("#current_date").html(
              monthNames[date.getMonth()] +
                " " +
                date.getDate() +
                ", " +
                date.getFullYear()
            );
            $("#hardware_version").html(result.hardware);
            $("#firmware_version").html(
              result.firmware + " (" + result.build + ")"
            );
            $("#device_id").html(result.device_id);
          },
          error: function () {
            console.log("error");
            disableScreen();
          },
        });
      }

      //Run first probe update to get values of sensors (we need them to adjust ranges on slider)
      $.ajax({
        url: window.location.origin + "/probe-update.json",
        async: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader(
            "Authorization",
            "Basic " + "KD5fPCk6KC1fLSl6eno="
          );
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        type: "GET",
        dataType: "json",
        data: {},
        success: function (result) {
          var probe_update = result.probe_update;
          probe_update.forEach(function (entry) {
            entry.nodes.forEach(function (node) {
              if (parseFloat($("." + node.id).attr("data-min")) > node.value) {
                $("." + node.id).attr(
                  "data-min",
                  Math.round((node.value - 10.0).toFixed(0) / 10) * 10
                );
              }
              if (
                parseFloat($("." + node.id).attr("data-max")) <
                node.value.toFixed(2)
              ) {
                $("." + node.id).attr(
                  "data-max",
                  Math.ceil((node.value + 10.0).toFixed(0) / 10) * 10
                );
              }
            });
          });
        },
        error: function () {
          disableScreen();
        },
      });
    },
    error: function () {
      disableScreen();
    },
  });

  //Run reboot button function
  reboot_check();
}

function create_template(template_type, data) {
  var confirmationModal = `
  	<div class="modal fade" id="confirmationModal" tabindex="-1" role="dialog" aria-labelledby="confirmationModal" aria-hidden="true">
				 <div class="modal-dialog" role="document">
				  <div class="modal-content">
				   <div class="modal-header">
				    <h5 class="modal-title">Confirmation</h5>
				    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
				     <span aria-hidden="true">&times;</span>
				    </button>
				   </div>
				   <div class="modal-body">
				    Are you sure?
				   </div>
				   <div class="modal-footer">
				    <button type="button" class="btn btn-danger" data-dismiss="modal">No</button>
				    <button type="button" class="btn btn-success" data-dismiss="modal" data-action="" id="confirm_action">Yes</button>
				   </div>
				  </div>
				 </div>
				</div>`;
  var sensorModal =
    `
  	<div class="modal fade" id="sensorModal" tabindex="-1" role="dialog" aria-labelledby="sensorModal" aria-hidden="true">
				 <div class="modal-dialog" role="document">
				  <div class="modal-content">
				   <div class="modal-header">
				    <h5 class="modal-title">Sensor</h5>
				    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
				     <span aria-hidden="true">&times;</span>
				    </button>
				   </div>
				   <div class="modal-body">
				    <form id="sensor_form">
						 	<div class="row">
								<div class="col-xs-6 col-md-4">Sensor name</div>
								<div class="col-xs-6 col-md-8 has-success">
									<input id="sensor_name" type="text" data-type="alphanumeric" data-min-length="1" data-max-length="32" class="form-control input-sm valid" ` +
    change_name +
    `>
								</div>
							</div>
							<div class="row">
								<div class="col-xs-6 col-md-4">Sensor location</div>
								<div class="col-xs-6 col-md-8 has-success">
									<input id="sensor_location" type="text" data-type="alphanumeric" data-max-length="32" class="form-control input-sm valid">
								</div>
							</div>
				    	<div class="row">
								<div class="col-xs-6 col-md-4">Sensor Type</div>
								<div class="col-xs-6 col-md-8 has-success" id="sensor_type">
								</div>
							</div>	
				    	<div class="row">
								<div class="col-xs-6 col-md-4">Sensor Status</div>
								<div class="col-xs-6 col-md-8 has-success" id="sensor_status">
								</div>
							</div>	
					    <div class="row">
								<div class="col-xs-6 col-md-4">Sensor Value</div>
								<div class="col-xs-6 col-md-8 has-success" id="sensor_value">
								</div>
							</div>
						 	<div class="row" style="padding-top:30px">
								<div class="col-xs-6 col-md-4">Range</div>
								<div class="col-xs-6 col-md-8 has-success sensormodal">
									<div id="range_modal">
									</div>				
									<input type="hidden" id="sensor_safe_low">
									<input type="hidden" id="sensor_safe_high">
									<input type="hidden" id="sensor_warn_low">
									<input type="hidden" id="sensor_warn_high">			
								</div>
							</div>
							<div data-min = "0" data-max = "90" data-step="1" id="test"></div>

				    </form>
				   </div>
				   <div class="modal-footer">
				    <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>
				    <button type="button" class="btn btn-success" id="save_btn">Save</button>
				   </div>
				  </div>
				 </div>
				</div>`;
  var buttons_container = `
			  	<div class="buttons_container">
				  	<button class="btn btn-md orange_btn" id="edit_btn" type="button">Edit</button>
				  	<button style="display:none" class="btn btn-md btn-success" id="save_btn" type="button">Save</button>
				  	<button style="display:none" class="btn btn-md btn-danger" id="cancel_btn" type="button">Cancel</button>
				 	</div>`;

  var template = ``;
  switch (template_type) {
    case "/config.shtml":
      template +=
        `
		  <div class="container main-content">
		  	<div class="title_buttons">
		  	<h1> Main settings </h1>
		  	` +
        buttons_container +
        `
			 	</div>
			 	<h2>Device</h2>
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Current System Date</div>
					<div id="current_date" class="col-xs-6 col-md-8 has-success">
					</div>
				</div>	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Current System Time</div>
					<div id="current_time" class="col-xs-6 col-md-8 has-success">
					</div>
					<input type="hidden" id="hidden_clock" name="hidden_clock">
				</div>		
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Hardware Version</div>
					<div id="hardware_version" class="col-xs-6 col-md-8 has-success">
					</div>
				</div>		
				<div class="row">
				 <div class="col-xs-6 col-md-4">Firmware Version</div>
				 <div id="firmware_version" class="col-xs-6 col-md-8 has-success">
				 </div>
			 </div>	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Device ID</div>
					<div id="device_id" class="col-xs-6 col-md-8 has-success">
					</div>
				</div>			 	

			 	<form id="device_info" name="device_info">
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Device Name</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" data-type="alphanumeric" data-max-length="20" id="device_name" name="device.name" value="${
              data.device.name
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="device_name_hidden" value="${
              data.device.name
            }">
					</div>
				</div>	
				<div class="row">
					<div class="col-xs-6 col-md-4">Site ID</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" id="device_site_id" data-type="alphanumeric" data-max-length="20" name="device.site_id" value="${
              data.device.site_id
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="device_site_id_hidden" value="${
              data.device.site_id
            }">
					</div>
				</div>		 	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Device Location</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" data-type="alphanumeric" data-max-length="20" id="device_location" name="device.location" value="${
              data.device.location
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="device_location_hidden" value="${
              data.device.location
            }">
					</div>
				</div>			 		
				<div class="row">
					<div class="col-xs-6 col-md-4">Sensor Polling</div>
					<div class="col-xs-6 col-md-8">
						<div class="input-group">
						<span class="input-group-addon">
							<small>every</small>
						</span>
						<input disabled type="number" data-type="number" data-value-min="2" data-value-max="59" id="device_polling_rate" name="device.polling_rate" value="${
              data.device.sensor_polling_rate
            }" class="form-control input-sm">
						<input disabled type="hidden" id="device_polling_rate_hidden" value="${
              data.device.sensor_polling_rate
            }">
						<span class="input-group-addon">
							<small>sec</small>
						</span>
						</div>
					</div>
				</div>			 		 	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Temperature Unit</div>
					<div class="col-xs-6 col-md-8">
						<select disabled data-type="select" id="device_fahrenheit" name="device.fahrenheit" class="form-control input-sm">
							<option value="false">Celsius</option>
							<option value="true" ${
                data.device.fahrenheit ? "selected" : ""
              }>Fahrenheit</option>
						</select>
						<input disabled type="hidden" id="device_fahrenheit_hidden" value="${
              data.device.fahrenheit
            }">
					</div>				
					</div>			 	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">OLED Screen</div>
					<div class="col-xs-6 col-md-8">
						<select data-type="select" disabled id="device_enable_oled" name="device.enable_oled" class="form-control input-sm">
							<option value="true">Enabled</option>
							<option value="false" ${
                data.device.oled_enabled ? "" : "selected"
              }>Disabled</option>
						</select>
						<input disabled type="hidden" id="device_enable_oled_hidden" value="${
              data.device.oled_enabled
            }">
					</div>		
				</div>			 	
			 	<h2>Network</h2>
			 	<div class="row">
					<div class="col-xs-6 col-md-4">DHCP</div>
					<div class="col-xs-6 col-md-8 has-success">
						<select data-type="select" disabled id="device_dhcp" name="net.dhcp" class="form-control input-sm">
							<option value="false">Disabled</option>
							<option value="true" ${data.network.dhcp ? "selected" : ""}>Enabled</option>
						</select>	
						<input disabled type="hidden" id="device_dhcp_hidden" value="${
              data.network.dhcp
            }">				
					</div>
				</div>		
			 	<div class="row">
					<div class="col-xs-6 col-md-4">IP Address</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" data-parent="dhcp" data-type="ip_address" id="net_ipaddr" name="net.ipaddr" value="${
              data.network.ip
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="net_ipaddr_hidden" value="${data.network.ip}">
					</div>
				</div>		
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Subnet</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" data-parent="dhcp" data-type="ip_address" id="net_subnet" name="net.subnet" value="${
              data.network.subnet
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="net_subnet_hidden" value="${
              data.network.subnet
            }">
					</div>
				</div>		
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Gateway</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" data-parent="dhcp" data-type="ip_address" id="net_gateway" name="net.gateway" value="${
              data.network.gateway
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="net_gateway_hidden" value="${
              data.network.gateway
            }">
					</div>
				</div>		
			 	<div class="row">
					<div class="col-xs-6 col-md-4">DNS1</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" data-parent="dhcp" data-type="ip_address" id="net_dns1" name="net.dns1" value="${
              data.network.dns1
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="net_dns1_hidden" value="${data.network.dns1}">
					</div>
				</div>		
			 	<div class="row">
					<div class="col-xs-6 col-md-4">DNS2</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" data-parent="dhcp" data-type="ip_address" id="net_dns2" name="net.dns2" value="${
              data.network.dns2
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="net_dns2_hidden" value="${data.network.dns2}">
					</div>
				</div>			 	
			 	<h2>SNTP</h2>
			 	<div class="row">
					<div class="col-xs-6 col-md-4">SNTP</div>
					<div class="col-xs-6 col-md-8 has-success">
						<select data-type="select" disabled name="sntp.enabled" id="sntp_enabled"class="form-control input-sm">
							<option value="false">Disabled</option>
							<option value="true" ${data.sntp.enabled ? "selected" : ""}>Enabled</option>
						</select>			
						<input disabled type="hidden" id="sntp_enabled_hidden" value="${
              data.sntp.enabled
            }">		
					</div>
				</div>		
			 	<div class="row">
					<div class="col-xs-6 col-md-4">SNTP Host</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" data-parent="sntp" id="sntp_server" name="sntp.server" value="${
              data.sntp.host
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="sntp_server_hidden" value="${data.sntp.host}">
					</div>
				</div>		
			 	<div class="row">
					<div class="col-xs-6 col-md-4">SNTP server port</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="number" data-parent="sntp" data-type="number" data-value-min="2" data-value-max="99999" id="sntp_port" name="sntp.port" value="${
              data.sntp.port
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="sntp_port_hidden" value="${data.sntp.port}">
					</div>
				</div>		
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Connection timeout (miliseconds)</div>
					<div class="col-xs-6 col-md-8 has-success">
						<div class="input-group">
							<input disabled type="number" data-parent="sntp" data-type="number" data-value-min="1000" data-value-max="600000" id="sntp_timeout" name="sntp.timeout" value="${
                data.sntp.timeout
              }" class="form-control input-sm valid">
							<input disabled type="hidden" id="sntp_timeout_hidden" value="${
                data.sntp.timeout
              }">
							<span class="input-group-addon">
								<small>ms</small>
							</span>
						</div>
					</div>
				</div>
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Update interval (seconds)</div>
					<div class="col-xs-6 col-md-8 has-success">
						<div class="input-group">
							<input disabled type="number" data-parent="sntp" data-type="number" data-value-min="300" data-value-max="604800" id="sntp_update_interval" name="sntp.update_interval" value="${
                data.sntp.update_interval
              }" class="form-control input-sm valid">
							<input disabled type="hidden" id="sntp_update_interval_hidden" value="${
                data.sntp.update_interval
              }">
							<span class="input-group-addon">
								<small>sec</small>
							</span>
						</div>
					</div>
				</div>		
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Timezone difference to UTC</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="number" data-parent="sntp" data-type="number" data-value-min="-12" data-value-max="12" id="sntp_time_zone" name="sntp.time_zone" value="${
              data.sntp.time_zone
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="sntp_time_zone_hidden" value="${
              data.sntp.time_zone
            }">
					</div>
				</div>		
			 </form>
			 <h2>Security</h2>
				<div class="row">
					<div class="col-xs-6 col-md-4"></div>
					<div class="col-xs-6 col-md-8 has-success">
						<div class="col-xs-6 col-md-4"><button class="btn btn-md orange_btn" style="width: max-content;" id="change_password" type="button">Change Username/Password</button></div>
					</div>	
				</div>	
				<div style="display:none" id="change_password_form">
					<div class="row">
						<div class="col-xs-6 col-md-4">Username</div>
						<div class="col-xs-6 col-md-8 has-success">
							<input type="text" data-type="alphanumeric" data-max-length="20" id="device_username" class="form-control input-sm valid">
						</div>
					</div>				 	
					<div class="row">
						<div class="col-xs-6 col-md-4">New Password</div>
						<div class="col-xs-6 col-md-8 has-success">
							<input type="password" data-type="alphanumeric" id="device_password" data-max-length="20" class="form-control input-sm valid">
						</div>
					</div>	 	
					<div class="row">
						<div class="col-xs-6 col-md-4">Repeat Password</div>
						<div class="col-xs-6 col-md-8 has-success">
							<input type="password" data-type="alphanumeric" id="device_password2" data-max-length="20" class="form-control input-sm valid">
						</div>
					</div>
					<div class="row">
						<div class="col-xs-6 col-md-4"></div>
						<div class="col-xs-6 col-md-8 has-success">
							<div class="col-xs-6 col-md-4"><button class="btn btn-md orange_btn" id="change_password_submit" type="button">Submit</button></div>
						</div>	
					</div>	
				</div>
				` +
        confirmationModal +
        `
			</div>`;
      break;
    case "/mqtt.shtml":
      if (data.replacements == undefined) {
        data.replacements = [];
        data.replacements[0] = {};
        data.replacements[0].place_holder = "";
        data.replacements[0].value = "";
      }
      template +=
        `
		  <div class="container main-content">
		  	<div class="title_buttons">
			  	<h1> MQTT</h1>
			  	` +
        buttons_container +
        `
			 	</div>
			 	<form id="mqtt_form" name="mqtt_form">
			 	<div class="row" style="padding-top: 30px;margin-bottom: -10px;">
					<div class="col-xs-6 col-md-4">Enabled</div>
					<input disabled value="${data.mqtt.enabled}" id="mqttbox_hidden" type="hidden">
					<div class="col-xs-6 col-md-8 has-success">
						<label class="switch">
						 <input type='hidden' value='false' name='mqtt.enabled'>
						 <input disabled value="true" name="mqtt.enabled" id="mqttbox" type="checkbox" ${
               data.mqtt.enabled ? "checked" : ""
             }>
						 <span class="slider round" ></span>
						</label>
					</div>
				</div>	
				<h3>Server</h3> 	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">MQTT host</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" data-type="alphanumeric" data-max-length="50"  id="mqtt_server_host" name="mqtt.server.host" value="${
              data.mqtt.server.host
            }" class="form-control input-sm valid">
						<input disabled type="hidden" data-type="alphanumeric" id="mqtt_server_host_hidden" value="${
              data.mqtt.server.host
            }">
					</div>
				</div>				 	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">MQTT Port</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="number" data-type="number" data-value-min="2" data-value-max="99999" id="mqtt_server_port" name="mqtt.server.port" value="${
              data.mqtt.server.port
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="mqtt_server_port_hidden" value="${
              data.mqtt.server.port
            }">
					</div>
				</div>				 	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">MQTT Version</div>
					<div class="col-xs-6 col-md-8 has-success">
						<select disabled data-type="select" id="mqtt_server_version" name="mqtt.server.version" class="form-control input-sm">
							<option value="3.1">3.1</option>
							<option value="3.1.1" ${
                data.mqtt.server.version == "3.1.1" ? "selected" : ""
              }>3.1.1</option>
						</select>
						<input disabled type="hidden" id="mqtt_server_version_hidden" value="${
              data.mqtt.server.version
            }">
					</div>
				</div>				 	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">MQTT Protocol</div>
					<div class="col-xs-6 col-md-8 has-success">
						<select disabled data-type="select" name="mqtt.server.prot" id="mqttprot" class="form-control input-sm">
							<option value="TCP">TCP</option>
							<option ${
                data.mqtt.server.prot == "TLS" ? "selected" : ""
              } value="TLS">TLS</option>
							<option ${
                data.mqtt.server.prot == "TLS_CERT" ? "selected" : ""
              } value="TLS_CERT">TLS_CERT</option>
						</select>
						<input disabled type="hidden" id="mqttprot_hidden" value="${
              data.mqtt.server.prot
            }">
					</div>
				</div>		
				<div id="mqtt_auth" ${
          data.mqtt.server.prot == "TLS_CERT" ? 'style="display:none"' : ""
        }>
					<h3>MQTT client authentication</h3>		 	
					<div class="row">
						<div class="col-xs-6 col-md-4">MQTT client user</div>
						<div class="col-xs-6 col-md-8 has-success">
							<input disabled ${
                data.mqtt.server.prot == "TLS_CERT" ? "disabled" : ""
              } type="text" data-type="alphanumeric" data-max-length="32" id="mqtt_auth_user" name="mqtt.auth.user" value="${
          data.mqtt.auth.user
        }" class="form-control input-sm valid">
							<input type="hidden" disabled id="mqtt_auth_user_hidden" value="${
                data.mqtt.auth.user
              }">
						</div>
					</div>				 	
					<div class="row">
						<div class="col-xs-6 col-md-4">MQTT client password</div>
						<div class="col-xs-6 col-md-8 has-success">
							<input disabled ${
                data.mqtt.server.prot == "TLS_CERT" ? "disabled" : ""
              } type="text" data-type="alphanumeric" data-max-length="32" id="mqtt_password" name="mqtt.auth.passw" value="${
          data.mqtt.auth.passw
        }" class="form-control input-sm valid">
						</div>
					</div>
				</div>			
				<h3>MQTT publish settings</h3>		 	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">MQTT topic</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" data-type="alphanumeric" data-max-length="20" id="mqtt_publish_topic" name="mqtt.topic" value="${
              data.replacements[0].place_holder != ""
                ? data.mqtt.publish.topic.replace(
                    data.replacements[0].place_holder,
                    data.replacements[0].value
                  )
                : data.mqtt.publish.topic
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="mqtt_publish_topic_hidden" value="${
              data.replacements[0].place_holder != ""
                ? data.mqtt.publish.topic.replace(
                    data.replacements[0].place_holder,
                    data.replacements[0].value
                  )
                : data.mqtt.publish.topic
            }">
					</div>
				</div>				 	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Publish interval (seconds)</div>
					<div class="col-xs-6 col-md-8 has-success">
						<div class="input-group">
							<input disabled type="number" data-type="number" data-value-min="1" data-value-max="7200" id="mqtt_publish_interval" name="mqtt.publish_interval" value="${
                data.mqtt.publish.interval
              }" class="form-control input-sm valid">
							<input disabled type="hidden" id="mqtt_publish_interval_hidden" value="${
                data.mqtt.publish.interval
              }">
							<span class="input-group-addon">
								<small>sec</small>
							</span>
						</div>
					</div>
				</div>
			 	<div class="row">
					<div class="col-xs-6 col-md-4">MQTT will message</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" data-type="alphanumeric" data-max-length="20" id="mqtt_will" name="mqtt.will" value="${
              data.mqtt.publish.will
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="mqtt_will_hidden" value="${
              data.mqtt.publish.will
            }">
					</div>
				</div>	
				<h3>MQTT connection settings</h3>	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Timeout (seconds)</div>
					<div class="col-xs-6 col-md-8 has-success">
						<div class="input-group">
							<input disabled type="number" data-type="number" data-value-min="0" data-value-max="100000" id="mqtt_timeout" name="mqtt.timeout" value="${
                data.mqtt.connection.timeout
              }" class="form-control input-sm valid">
							<input disabled type="hidden" id="mqtt_timeout_hidden" value="${
                data.mqtt.connection.timeout
              }">
							<span class="input-group-addon">
								<small>sec</small>
							</span>
						</div>
					</div>
				</div>	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Keep alive (seconds)</div>
					<div class="col-xs-6 col-md-8 has-success">
						<div class="input-group">
							<input disabled type="number" data-type="number" data-value-min="0" data-value-max="14400" id="mqtt_keepalive" name="mqtt.keepalive" value="${
                data.mqtt.connection.keepalive
              }" class="form-control input-sm valid">
							<input disabled type="hidden" id="mqtt_keepalive_hidden" value="${
                data.mqtt.connection.keepalive
              }">
							<span class="input-group-addon">
								<small>sec</small>
							</span>
						</div>
					</div>
				</div>	
				<h3>Prefix</h3>
				<div class="row">
					<div class="col-xs-6 col-md-4">Prefix of topic to be subscribed. The device id will be concatenated</div>
					<div class="col-xs-6 col-md-8 has-success">
						<input disabled type="text" data-type="alphanumeric" data-max-length="20" id="mqtt_subscribe_topic_prefix" name="mqtt.subscribe_topic_prefix" value="${
              data.replacements[0].place_holder != ""
                ? data.mqtt.subscribe_topic_prefix.replace(
                    data.replacements[0].place_holder,
                    data.replacements[0].value
                  )
                : data.mqtt.subscribe_topic_prefix
            }" class="form-control input-sm valid">
						<input disabled type="hidden" id="mqtt_subscribe_topic_prefix_hidden" value="${
              data.replacements[0].place_holder != ""
                ? data.mqtt.subscribe_topic_prefix.replace(
                    data.replacements[0].place_holder,
                    data.replacements[0].value
                  )
                : data.mqtt.subscribe_topic_prefix
            }">
					</div>
				</div>	
				<h3>TLS Certificates</h3>	
				<div class="row">
				 <div class="col-xs-6 col-md-4">Client Certificate</div>
				 <div class="col-xs-6 col-md-8 has-success">
					 <div class="input-group">
					 <textarea disabled rows="5" cols="50" data-type="alphanumeric" data-max-length="1300" id="vault_client_cert" name="vault.client_cert" class="certificate_input" value="${
             data.vault[0].client_cert
           }">${data.vault[0].client_cert}</textarea>
					 <input disabled type="hidden" id="vault_client_cert_hidden" value="${
             data.vault[0].client_cert
           }">
					 </div>
				 </div>
			 </div>	
					<div class="row">
				 <div class="col-xs-6 col-md-4">Private key</div>
				 <div class="col-xs-6 col-md-8 has-success">
					 <div class="input-group">
					 <textarea disabled rows="4" cols="50" data-type="alphanumeric" data-max-length="1800" id="priv_key" name="vault.priv_key" value="value="${
             data.vault[0].priv_key
           }">${data.vault[0].priv_key}</textarea>
					 </div>
				 </div>
			 </div>	
			 </form>
			 ` +
        confirmationModal +
        `
			</div>`;
      break;
    case "/vault.shtml":
      template +=
        `
		  <div class="container main-content">
		  	<div class="title_buttons">
			  	<h1> Vault</h1>
			  	` +
        buttons_container +
        `  	
			 	</div>		  	
		  	<form id="vault_form" name="vault_form">
				<h3>TLS Certificates</h3>	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Client Certificate</div>
					<div class="col-xs-6 col-md-8 has-success">
						<div class="input-group">
						<textarea disabled rows="5" cols="50" data-type="alphanumeric" data-max-length="1300" name="vault.client_cert" value="${data.vault[0].client_cert}">${data.vault[0].client_cert}</textarea>
						</div>
					</div>
				</div>	
				 	<div class="row">
					<div class="col-xs-6 col-md-4">Private key</div>
					<div class="col-xs-6 col-md-8 has-success">
						<div class="input-group">
						<textarea disabled rows="4" cols="50" data-type="alphanumeric" data-max-length="1800" name="vault.priv_key" value="value="${data.vault[0].priv_key}">${data.vault[0].priv_key}</textarea>
						</div>
					</div>
				</div>	
			 </form>
			 ` +
        confirmationModal +
        `
			</div>`;
      break;
    case "/sensors.shtml":
      template += `<div class="container main-content">
			  	<div class="title_buttons">
		  			<h1> Sensors</h1>
					</div>
					<div class="table-responsive"> 
					 <table id="sensor_list" class="table">
					  <thead>
					   <tr>
					    <th></th>
					    <th>Sensor Name</th>
					    <th>Sensor Type</th>
					    <th>Location</th>
					    <th style="width:50%">Range</th>
					   </tr>
					  </thead>
					  <tbody>
					`;
      data.probe_list.forEach(function (entry) {
        entry.nodes.forEach(function (node) {
          var min_safe = Math.round(node.alarm.min.safe / 10) * 10 - 10;
          var max_safe = Math.ceil(node.alarm.max.safe / 10) * 10 + 10;
          if (min_safe == max_safe) min_safe -= 10;
          var min_warn = Math.round(node.alarm.min.warn / 10) * 10 - 10;
          var max_warn = Math.ceil(node.alarm.max.warn / 10) * 10 + 10;
          if (min_warn == max_warn) min_warn -= 10;
          template += `
					<tr class="sensor_item" data-id="${node.id}" data-location="${node.location}"
					 data-type="${node.type}" data-unit="${node.unit}" data-name="${node.name}" 
					 data-warn-min="${node.alarm.min.warn}" data-warn-max="${node.alarm.max.warn}" 
					 data-safe-min="${node.alarm.min.safe}" data-safe-max="${node.alarm.max.safe}">
					  <td id="${node.id}-status" class="status_col" data-unit="${node.unit}"></td>
					  <td>${node.name}
						</td>
					  <td>${node.type}</td>
					  <td>${node.location}
						</td>
							<td class="safe-range-slider"> 
							<div class="${node.id} warning_range multiRange"
							data-rangeid = "${node.id}"
							data-minsafe="${node.alarm.min.safe}"
							data-maxsafe="${node.alarm.max.safe}"
							data-minwarn="${node.alarm.min.warn}"
							data-maxwarn="${node.alarm.max.warn}"
							data-min = "${min_warn}"
							data-max = "${max_warn}"
							data-step = "1"/>
							</div>
							<input type="hidden" name="alarm.min.safe[${node.id}]" id="min-safe-${node.id}" value="${node.alarm.min.safe}">
							<input type="hidden" name="alarm.max.safe[${node.id}]" id="max-safe-${node.id}" value="${node.alarm.max.safe}">
							<input type="hidden" name="alarm.min.warn[${node.id}]" id="min-warn-${node.id}" value="${node.alarm.min.warn}">
							<input type="hidden" name="alarm.max.warn[${node.id}]" id="max-warn-${node.id}" value="${node.alarm.max.warn}">
						</td>
					  </div>
					 </li>`;
        });
      });
      template +=
        `</tbody></table>
			` +
        confirmationModal +
        `	
				</div>
				` +
        sensorModal;
      break;
    case "/maintenance.shtml":
      template +=
        `
		  <div class="container main-content maintenance">
		  	<div class="title_buttons">
			  	<h1> Maintenance</h1> 	
			 	</div>		  	

			 	<div class="row">
					<div class="col-xs-6 col-md-4">Firmware Version</div>
					<div id="firmware_version" class="col-xs-6 col-md-8 has-success">
					${data.firmware} (${data.build})<br>
					<a href="/fwupdate.shtml"><button class="btn btn-md orange_btn" id="upgrade_firmware" type="button">Upgrade Firmware</button></a>
					</div>
				</div>	

			 	<div class="row">
					<div class="col-xs-6 col-md-4">Reboot Device</div>
					<div class="col-xs-6 col-md-8 has-success">
				  	<button class="btn btn-md btn-danger action_btn" type="button" data-toggle="modal" data-target="#confirmationModal" data-action="reboot">Reboot</button>
					</div>	
				</div>	
			 	<div class="row">
					<div class="col-xs-6 col-md-4">Default settings</div>
					<div class="col-xs-6 col-md-8 has-success">
				  	<button class="btn btn-md btn-danger action_btn" type="button" data-toggle="modal" data-target="#confirmationModal" data-action="defaults">Reset</button>
					</div>	
				</div>
				` +
        confirmationModal +
        `
			</div>`;
      break;
    default:
  }
  return template;
}

$(document).ready(function () {
  refreshCookie();

  //Change password
  $("body").on("click", "#change_password", function () {
    $("#change_password_form").toggle();
  });
  //Hide MQTT authentication if TLS CERT selected
  $("body").on("change", "#mqttprot", function () {
    if (document.getElementById("mqttprot").value == "TLS_CERT") {
      $("#mqtt_auth").hide();
      $("#mqtt_auth").find("input").prop("disabled", true);
    } else {
      $("#mqtt_auth").show();
      $("#mqtt_auth").find("input").prop("disabled", false);
    }
  });

  //Remove spaces from start/end of certificate string
  $("body").on("change", ".certificate_input", function () {
    $(this).val($(this).val().trim());
    $(this).val(
      $(this)
        .val()
        .replace(/\r?\n|\r/g, "")
    );
  });

  //Switching Dark/Light theme
  $("body").on("click", "#theme_switch", function () {
    if ($("#theme_switch").prop("checked")) {
      $("body").addClass("dark");
      localStorage.setItem("servercheck_theme", "dark");
    } else {
      $("body").removeClass("dark");
      localStorage.setItem("servercheck_theme", "light");
    }
  });

  $("body").on("click", "#edit_btn", function () {
    var form_id = $("body").find("form").attr("id");
    $(this).toggle();
    $("#save_btn").toggle();
    $("#cancel_btn").toggle();
    var dhcp = $('[name ="net.dhcp"]').val();
    $("form#" + form_id + " :input").each(function () {
      var input = $(this);
      if (input.attr("data-parent") == "dhcp") {
        if (dhcp == "true") input.prop("disabled", true);
        else input.prop("disabled", false);
      }
      //mqtt disable
      else if (
        input.prop("id") == "mqtt_publish_topic" ||
        input.prop("id") == "mqtt_subscribe_topic_prefix" ||
        input.prop("id") == "device_fahrenheit"
      ) {
        if (disable_mqtt) input.prop("disabled", true);
      } else input.prop("disabled", false);
      if (input.prop("id") == "mqttprot" && input.val() == "TLS_CERT") {
        $("#mqtt_auth").find("input").prop("disabled", true);
      }
    });

    if ($(".alarms").length) {
      $(".alarms .values").css("display", "none");
      $(".alarms .input-group-addon").css("display", "block");
    }
  });
  //Action on cancel button
  $("body").on("click", "#cancel_btn", function () {
    var form_id = $("body").find("form").attr("id");
    $(this).toggle();
    $("#save_btn").toggle();
    $("#edit_btn").toggle();
    $("form#" + form_id + " :input").each(function () {
      var input = $(this);
      input.prop("disabled", true);
    });

    if ($(".alarms").length) {
      $(".alarms .values").css("display", "block");
      $(".alarms .input-group-addon").css("display", "none");
    }
  });

  //Action for saving form
  $("body").on("click", "#save_btn", function () {
    $("#loader").show();
    $("#loader").addClass("loader_save");

    var form_id = $("body").find("form").attr("id");
    if (form_id == "sensor_form") var path = "nodes";
    else var path = "main";
    $("form#" + form_id + " :input").each(function () {
      var input = $(this);
      var id = input.attr("id");
      //Not used anymore I believe, to disable some input if checkbox is checked
      if (input.attr("type") == "checkbox") {
        if ($(input).is(":checked")) $(input).prev().prop("disabled", true);
        else $(input).prev().prop("disabled", false);
      }
      //Disable input if priv key / password is set as "***"
      if ($(input).attr("id") == "priv_key" && $(input).val() == "***")
        $(input).prop("disabled", true);
      if ($(input).attr("id") == "mqtt_password" && $(input).val() == "***")
        $(input).prop("disabled", true);

      //Disable mqtt_auth inputs if TLS_CERT is selected
      if (input.prop("id") == "mqttprot" && input.val() == "TLS_CERT") {
        $("#mqtt_auth").find("input").prop("disabled", true);
      }
      //Disable input if its value is empty
      /* 		if(input.val() == "")
			input.prop("disabled", true);
 */ //Disable input if hidden value equals current value, to stop sending data that hasn't been changed
      if (input.val() == $("#" + id + "_hidden").val())
        input.prop("disabled", true);
      else $("#" + id + "_hidden").val(input.val());
      //Trim all inputs
      input.val(input.val().trim());
    });
    error = validation(form_id);
    var formData = new FormData(document.getElementById(form_id));
    var data = [...formData.entries()];

    var asString = data
      .map((x) => `${x[0]}=${encodeURIComponent(x[1])}`)
      .join("&");

    if (error != 0) {
      $("#loader").hide();
    }
    //If nothing new is entered
    else if (form_id != "sensor_form" && asString.length == 0) {
      setTimeout(function () {
        $(".main-content").prepend(
          '<div class="alert alert-success saved_msg" role="alert"><h3>Settings saved!</h3></div>'
        );
        $(".saved_msg").fadeOut(2500);
        $("#loader").hide();
        $("#save_btn").toggle();
        $("#cancel_btn").toggle();
        $("#edit_btn").toggle();
        $("form#" + form_id + " :input").each(function () {
          var input = $(this);
          input.prop("disabled", true);
        });
      }, 1000);
    } else {
      $.ajax({
        url: window.location.origin + "/doconfig?d=" + path,
        beforeSend: function (xhr) {
          xhr.setRequestHeader(
            "Authorization",
            "Basic " + "KD5fPCk6KC1fLSl6eno="
          );
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        type: "POST",
        data: asString,
        success: function (result) {
          $("#loader").hide();
          if (form_id == "sensor_form") {
            $("#" + form_id).prepend(
              '<div class="alert alert-success saved_msg" role="alert"><h3>Settings saved!</h3></div>'
            );
            $(".saved_msg").fadeOut(2500);
            location.reload();
          } else {
            $(".main-content").prepend(
              '<div class="alert alert-success saved_msg" role="alert"><h3>Settings saved!</h3></div>'
            );
            $(".saved_msg").fadeOut(2500);
            $("#save_btn").toggle();
            $("#cancel_btn").toggle();
            $("#edit_btn").toggle();
            $("form#" + form_id + " :input").each(function () {
              var input = $(this);
              input.prop("disabled", true);
            });
          }

          if ($(".alarms").length) {
            $(".alarms .values").css("display", "block");
            $(".alarms .input-group-addon").css("display", "none");
            fill_old_alarms("alarm_min_safe");
            fill_old_alarms("alarm_max_safe");
            fill_old_alarms("alarm_min_warn");
            fill_old_alarms("alarm_max_warn");
          }
        },
        error: function () {
          $("#loader").hide();
          disableScreen();
        },
      });
    }
    reboot_check();
  });

  //Action for clicking on reboot/reset button
  $("body").on("click", ".action_btn", function () {
    action = $(this).attr("data-action");
    if (action == "reboot")
      $("#confirmationModal .modal-body").html(
        "Are you sure you want to reboot the device?"
      );
    else
      $("#confirmationModal .modal-body").html(
        "Are you sure you want to reset device to default settings?"
      );
    $("#confirm_action").attr("data-action", action);
  });

  //Action for confirming reboot/reset to default
  $("body").on("click", "#confirm_action", function () {
    action = $(this).attr("data-action");
    do_action(action);
  });

  //Action on changing password button
  $("body").on("click", "#change_password_submit", function () {
    $("#change_password_form").find(".error_text").remove();
    var username = $("#device_username").val();
    var password = $("#device_password").val();
    var password2 = $("#device_password2").val();
    var error = 0;
    if (username.length < 1 || username.length > 20) {
      text =
        '<span class="error_text">Please enter username between 1 and 20 characters!</span>';
      $("#device_username").parent().append(text);
      error = 1;
    }
    if (password.length < 1 || password.length > 20) {
      text =
        '<span class="error_text">Please enter password between 1 and 20 characters!</span>';
      $("#device_password").parent().append(text);
      error = 1;
    }
    if (password != password2) {
      text = '<span class="error_text">Passwords do not match!</span>';
      $("#device_password").parent().append(text);
      error = 1;
    }
    if (error == 0) {
      $("#loader").show();
      $("#loader").addClass("loader_save");

      $.ajax({
        url: window.location.origin + "/doconfig?d=main",
        beforeSend: function (xhr) {
          xhr.setRequestHeader(
            "Authorization",
            "Basic " + "KD5fPCk6KC1fLSl6eno="
          );
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        type: "POST",
        data: "auth.username=" + username + "&auth.password=" + password,
        success: function (result) {
          location.reload();
        },
        error: function () {
          $("#loader").hide();
          disableScreen();
        },
      });
    }
  });

  $("body").on("click", ".sensor_item", function () {
    var id = $(this).attr("data-id");
    var location = $(this).attr("data-location");
    var unit = $(this).attr("data-unit");
    var type = $(this).attr("data-type");
    var value = $(this).attr("data-value");
    var data_warn_min = $(this).attr("data-warn-min");
    var data_warn_max = $(this).attr("data-warn-max");
    var data_safe_min = $(this).attr("data-safe-min");
    var data_safe_max = $(this).attr("data-safe-max");
    var min_warn = Math.round(data_warn_min / 10) * 10 - 10;
    var max_warn = Math.ceil(data_warn_max / 10) * 10 + 10;
    if (value < min_warn)
      min_warn = Math.round((parseFloat(value) - 10) / 10) * 10;
    if (value > max_warn)
      max_warn = Math.round((parseFloat(value) + 10) / 10) * 10;
    var name = $(this).attr("data-name");
    $("#sensor_type").html(type);
    $("#sensor_location").val(location);
    $("#sensor_location").attr("name", "location[" + id + "]");
    $("#sensor_name").val(name);
    $("#sensor_name").attr("name", "name[" + id + "]");
    $("#sensor_safe_low").val(data_safe_min);
    $("#sensor_safe_low").attr("name", "alarm.min.safe[" + id + "]");
    $("#sensor_safe_high").val(data_safe_max);
    $("#sensor_safe_high").attr("name", "alarm.max.safe[" + id + "]");
    $("#sensor_warn_low").val(data_warn_min);
    $("#sensor_warn_low").attr("name", "alarm.min.warn[" + id + "]");
    $("#sensor_warn_high").val(data_warn_max);
    $("#sensor_warn_high").attr("name", "alarm.max.warn[" + id + "]");
    $("#sensorModal .multiRange").attr("id", "range_modal");
    $("#range_modal").html("");
    $("#range_modal").attr("data-min", min_warn);
    $("#range_modal").attr("data-max", max_warn);

    var multiRangeElm = document.getElementById("range_modal");
    var multiRange = new MultiRange(multiRangeElm, {
      ranges: [
        parseFloat(data_warn_min),
        parseFloat(data_safe_min),
        parseFloat(data_safe_max),
        parseFloat(data_warn_max),
      ],
      step: 0,
    });
    addMarks(
      multiRange.DOM.ticks,
      value,
      min_warn,
      max_warn,
      data_warn_min,
      data_warn_max,
      data_safe_min,
      data_safe_max,
      1
    );

    multiRange.on("change", function (e) {
      switch (e.detail.idx) {
        case 1:
          $("#sensor_warn_low").val(e.detail.value.toFixed(2));
          break;
        case 2:
          $("#sensor_safe_low").val(e.detail.value.toFixed(2));
          break;
        case 3:
          $("#sensor_safe_high").val(e.detail.value.toFixed(2));
          break;
        case 4:
          $("#sensor_warn_high").val(e.detail.value.toFixed(2));
          break;
        default:
      }
    });
    $.ajax({
      url: window.location.origin + "/probe-update.json",
      async: true,
      beforeSend: function (xhr) {
        xhr.setRequestHeader(
          "Authorization",
          "Basic " + "KD5fPCk6KC1fLSl6eno="
        );
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      type: "GET",
      dataType: "json",
      data: {},
      success: function (result) {
        var probe_update = result.probe_update;
        probe_update.forEach(function (entry) {
          entry.nodes.forEach(function (node) {
            if (id == node.id) {
              if (node.state.type == "SAFE") node.state.type = "OK";
              $("#sensor_status").html(node.state.type);
              $("#sensor_value").html(node.value.toFixed(2) + unit);
            }
          });
        });
        $("#sensorModal").modal("toggle");
      },
      error: function () {
        disableScreen();
      },
    });
  });

  $("body").on("change", '[name ="net.dhcp"]', function () {
    var dhcp = $('[name ="net.dhcp"]').val();
    $("form#device_info :input").each(function () {
      var input = $(this);
      if (input.attr("data-parent") == "dhcp") {
        if (dhcp == "true") input.prop("disabled", true);
        else input.prop("disabled", false);
      }
    });
  });

  $("body").on("change", '[type ="file"]', function () {
    var input = $(this);
    if (input.attr("data-type") == "certificate") {
      var reader = new FileReader();
      reader.onload = function (e) {
        var string = reader.result;
        string = string.substring(0, string.length - 1);
        input.next().val(string);
      };
      var file = input.prop("files")[0];
      if (typeof file != "undefined") reader.readAsText(file);
      else $(input).next().prop("disabled", true);
    }
  });
});

//Validating forms
function validation(form_id) {
  var ipformat =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  var error = 0;
  $("form#" + form_id + " :input").each(function () {
    var input = $(this);
    if (input.prop("disabled") != true) {
      var data_type = input.attr("data-type");
      var value = input.val();
      var min_val = parseInt($(input).attr("data-value-min"));
      var max_val = parseInt($(input).attr("data-value-max"));
      var max_len = parseInt($(input).attr("data-max-length"));
      var min_len = parseInt($(input).attr("data-min-length"));
      switch (data_type) {
        case "ip_address":
          if (value != "") {
            if (!value.match(ipformat)) {
              error += 1;
              create_error(data_type, input);
            } else {
              $(input).next(".error_text").remove();
              $(input).removeClass("is-invalid");
            }
          }
          break;
        case "number":
          if (!Number.isInteger(parseInt(value))) {
            error += 1;
            create_error(data_type, input);
          } else if (parseInt(value) < min_val || parseInt(value) > max_val) {
            error += 1;
            create_error(data_type, input, min_val, max_val);
          } else {
            $(input).next(".error_text").remove();
            $(input).removeClass("is-invalid");
          }
        case "alphanumeric":
          if (value.length > max_len) {
            error += 1;
            create_error(data_type, input, 0, 0, 0, max_len);
          } else if (value.length < min_len) {
            error += 1;
            create_error(data_type, input, 0, 0, min_len, 0);
          } else {
            $(input).next(".error_text").remove();
            $(input).removeClass("is-invalid");
          }
          break;
        default:
      }
    }
  });
  return error;
}
function create_error(
  data_type,
  input,
  min_val = 0,
  max_val = 0,
  min_len = 0,
  max_len = 0
) {
  $(input).parent().find(".error_text").remove();
  var text = "";
  switch (data_type) {
    case "ip_address":
      text = '<span class="error_text">Please enter valid IP address!</span>';
      break;
    case "number":
      if (max_val != 0)
        text =
          '<span class="error_text">Please enter valid number between ' +
          min_val +
          " and " +
          max_val +
          "!</span>";
      else text = '<span class="error_text">Please enter valid number!</span>';
      break;
    case "alphanumeric":
      if (max_len != 0)
        text =
          '<span class="error_text">Please enter up to ' +
          max_len +
          " characters!</span>";
      else if (min_len != 0)
        text =
          '<span class="error_text">Please enter at least ' +
          min_len +
          " characters!</span>";
      break;
    case "password":
      text = '<span class="error_text">Password must not be "***"!</span>';
      break;
    default:
      text = "";
  }
  $(input).addClass("is-invalid");
  $(input).parent().append(text);

  //unknown bug, on this input error gets immediately removed, so we add it
  if (input.attr("name") == "sntp.time_zone") $(input).parent().append(text);
}
function do_action(action) {
  $.ajax({
    url: window.location.origin + "/actions",
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "Basic " + "KD5fPCk6KC1fLSl6eno=");
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    type: "POST",
    dataType: "json",
    data: action,
    statusCode: {
      202: function () {
        location.replace("/");
      },
    },
    success: function (result) {},
    error: function () {
      disableScreen();
    },
  });
}

var expanded = false;

function showCheckboxes(id) {
  var checkboxes = document.getElementById(id);
  if (!expanded) {
    checkboxes.style.display = "block";
    expanded = true;
  } else {
    checkboxes.style.display = "none";
    expanded = false;
  }
}
function events_checkbox(node, event) {
  var select = `
		 <div class="multiselect">
		  <div class="selectBox" onclick="showCheckboxes('${node.id}-${event}')">
		   <select disabled>
		    <option>Select events</option>
		   </select>
		   <div class="overSelect"></div>
		  </div>
		  <div class="checkboxes" id="${node.id}-${event}">
		   <label for="ev.on_down.${event}[${node.id}]">
			  <input type='hidden' value='false' name="ev.on_down.${event}[${node.id}]">
			  <input disabled value="true" name="ev.on_down.${event}[${
    node.id
  }]" type="checkbox" ${node.events["on_down"]["${event}"] ? "checked" : ""}>
				On down</label>
		   <label for="ev.on_offline.${event}[${node.id}]">
			  <input type='hidden' value='false' name="ev.on_offline.${event}[${node.id}]">
			  <input disabled value="true" name="ev.on_offline.${event}[${
    node.id
  }]" type="checkbox" ${node.events["on_offline"]["${event}"] ? "checked" : ""}>
				On offline</label>
		   <label for="ev.on_online.${event}[${node.id}]">
			  <input type='hidden' value='false' name="ev.on_online.${event}[${node.id}]">
			  <input disabled value="true" name="ev.on_online.${event}[${
    node.id
  }]" type="checkbox" ${node.events["on_online"]["${event}"] ? "checked" : ""}>
				On online</label>
		   <label for="ev.on_safe.${event}[${node.id}]">
			  <input type='hidden' value='false' name="ev.on_safe.${event}[${node.id}]">
			  <input disabled value="true" name="ev.on_safe.${event}[${
    node.id
  }]" type="checkbox" ${node.events["on_safe"]["${event}"] ? "checked" : ""}>
				On safe</label>
		  </div>
		 </div>
		</td>
		`;
  return select;
}

function fill_old_alarms(alarm_class) {
  $("." + alarm_class).each(function (i, obj) {
    $(obj)
      .parent()
      .parent()
      .find("." + alarm_class + "_old")
      .html($(obj).val());
  });
}

function startTime() {
  var today = new Date(parseInt($("#hidden_clock").val()));

  $("#current_time").html(today.toISOString().substr(11, 8));
  $("#hidden_clock").val(parseInt($("#hidden_clock").val()) + 1000);
  var t = setTimeout(startTime, 1000);
}

//Run probe update when we have loaded sensors
var waitForSensors = function (selector, callback) {
  if ($(selector).length) {
    callback();

    var multiRangeEls = document.querySelectorAll(".multiRange");
    var rangs = new Array();
    for (var i = 0, len = multiRangeEls.length; i < len; i++) {
      value = parseFloat($(multiRangeEls[i]).attr("data-value"));
      datamin = parseFloat($(multiRangeEls[i]).attr("data-min"));
      datamax = parseFloat($(multiRangeEls[i]).attr("data-value"));
      minwarn = parseFloat($(multiRangeEls[i]).attr("data-minwarn"));
      maxwarn = parseFloat($(multiRangeEls[i]).attr("data-maxwarn"));
      minsafe = parseFloat($(multiRangeEls[i]).attr("data-minsafe"));
      maxsafe = parseFloat($(multiRangeEls[i]).attr("data-maxsafe"));
      rangs[i] = new MultiRange(multiRangeEls[i], {
        ranges: [minwarn, minsafe, maxsafe, maxwarn],
        step: 0,
      });
      $(rangs[i].DOM.rangeWrap).attr({
        datamin: parseFloat($(multiRangeEls[i]).attr("data-min")),
        datamax: parseFloat($(multiRangeEls[i]).attr("data-max")),
        minwarn: parseFloat($(multiRangeEls[i]).attr("data-minwarn")),
        maxwarn: parseFloat($(multiRangeEls[i]).attr("data-maxwarn")),
        minsafe: parseFloat($(multiRangeEls[i]).attr("data-minsafe")),
        maxsafe: parseFloat($(multiRangeEls[i]).attr("data-maxsafe")),
        dataid: rangs[i].DOM.scope.classList[0],
      });

      id = rangs[i].DOM.scope.classList[0];
      rangs[i].on("change", function (e) {
        id = e.detail.id.DOM.scope.classList[0];
        switch (e.detail.idx) {
          case 1:
            $("#min-safe-" + id).val(e.detail.value.toFixed(2));
            break;
          case 2:
            $("#max-safe-" + id).val(e.detail.value.toFixed(2));
            break;
          case 3:
            $("#min-warn-" + id).val(e.detail.value.toFixed(2));
            break;
          case 4:
            $("#max-warn-" + id).val(e.detail.value.toFixed(2));
            break;
          default:
        }
      });
    }
  } else {
    setTimeout(function () {
      waitForSensors(selector, callback);
    }, 1000);
  }
};

waitForSensors("#sensor_list", function () {
  probe_update();
});

//Probe update, function to load sensor values
function probe_update() {
  $.ajax({
    url: window.location.origin + "/probe-update.json",
    async: true,
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "Basic " + "KD5fPCk6KC1fLSl6eno=");
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    type: "GET",
    dataType: "json",
    data: {},
    success: function (result) {
      var probe_update = result.probe_update;
      probe_update.forEach(function (entry) {
        entry.nodes.forEach(function (node) {
          if (node.state.type == "SAFE") {
            status = "#28a745";
            status_txt = "OK";
          } else if (node.state.type == "DOWN") {
            status_txt = "DOWN";
            status = "#dc3545";
          } else {
            status_txt = "WARNING";
            status = "#fe8f1d";
          }
          $("[data-id=" + node.id + "]").attr(
            "data-value",
            node.value.toFixed(2)
          );
          $("[dataid=" + node.id + "]").attr(
            "data-value",
            node.value.toFixed(2)
          );
          $("#" + node.id + "-status").css("background-color", status);
          $("#" + node.id + "-status").html(
            '<span class="status_value"><b>' +
              node.value.toFixed(2) +
              $("#" + node.id + "-status").attr("data-unit") +
              "</span>"
          );
          $("." + node.id + "-range").attr("data-mark", node.value.toFixed(2));
        });
      });
      var ranges_existing = document.querySelectorAll(
        "#sensor_list .multiRange__rangeWrap"
      );
      $("#sensor_list .multiRange__rangeWrap .mark").remove();
      for (var i = 0, len = ranges_existing.length; i < len; i++) {
        el = ranges_existing[i];
        value = el.getAttribute("data-value");
        min_warn = el.getAttribute("datamin");
        max_warn = el.getAttribute("datamax");
        data_warn_min = el.getAttribute("minwarn");
        data_warn_max = el.getAttribute("maxwarn");
        data_safe_min = el.getAttribute("minsafe");
        data_safe_max = el.getAttribute("maxsafe");
        addMarks(
          ranges_existing[i],
          value,
          min_warn,
          max_warn,
          data_warn_min,
          data_warn_max,
          data_safe_min,
          data_safe_max
        );
      }
    },
    error: function () {},
  });
}
if (window.location.href.indexOf("sensors") > -1) {
  var refreshIntervalId = window.setInterval(function () {
    probe_update();
  }, 3000);
}

//Adding markers on sensors
function addMarks(
  slider,
  mark,
  min,
  max,
  warnmin,
  warnmax,
  safemin,
  safemax,
  modal = 0
) {
  var html = "";
  var left = 0;
  var i;
  mark = parseFloat(mark);
  warnmin = parseFloat(warnmin);
  warnmax = parseFloat(warnmax);
  safemin = parseFloat(safemin);
  safemax = parseFloat(safemax);
  var percent = ((mark - min) / (max - min)) * 100 - 3;
  if (percent < 0) percent = 0;
  var safe = "safe";
  if ((mark < safemin && mark > warnmin) || (mark > safemax && mark < warnmax))
    safe = "warning";
  else if (mark < warnmin || mark > warnmax) safe = "down";
  else safe = "safe";
  html +=
    '<span class="mark ' +
    safe +
    '" style="left: ' +
    percent +
    '%;">' +
    mark +
    "</span>";
  if (modal != 0) $(slider).parent().append(html);
  else $(slider).append(html);
}

//Disabling screen on error
function disableScreen() {
  $errorMsg = `<div style="z-index:1001;" class="alert alert-danger" id="errorConnect" role="alert">
	There has been an error with connecting to the device!<br/>
	 Please check your internet connection, and make sure that device is turned on!
	 </div>`;

  if ($("#errorConnect").length == 0) {
    $("content").prepend($errorMsg);
    if ($("#sensorModal").hasClass("show")) $("#sensorModal").modal("toggle");
    var div = document.createElement("div");
    div.className += "overlayDisable";
    $("content").prepend(div);
    clearInterval(refreshIntervalId);
  }
}

//Check if we should reboot
function reboot_check() {
  $.ajax({
    url: window.location.origin + "/info.json",
    async: false,
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "Basic " + "KD5fPCk6KC1fLSl6eno=");
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    type: "GET",
    dataType: "json",
    data: {},
    success: function (result) {
      var reboot = result.reboot_needed;
      if (reboot && $("#reboot_apply").length == 0)
        $(".navbar-nav").prepend(`<button style="width:fit-content"
				class="btn btn-md btn-danger action_btn" data-toggle="modal" 
				data-target="#confirmationModal" id="reboot_apply" data-action="reboot">Reboot to apply</button>`);
    },
    error: function () {},
  });
}

var reboot_interval = window.setInterval(function () {
  reboot_check();
}, 3000);
