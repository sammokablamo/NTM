// ----------- CAR TUTORIAL SAMPLE PROJECT, ? Andrew Gotow 2009 -----------------

// Here's the basic car script described in my tutorial at www.gotow.net/andrew/blog.
// A Complete explaination of how this script works can be found at the link above, along
// with detailed instructions on how to write one of your own, and tips on what values to 
// assign to the script variables for it to work well for your application.

// Contact me at Maxwelldoggums@Gmail.com for more information.





var BackWheelCenter : WheelCollider; // These variables allow the script to power the wheels of the car.
var BackWheelLTOuter : WheelCollider; //sam:adding extra colliders to add thickness
var BackWheelRTOuter : WheelCollider;
var BackWheelLTMid : WheelCollider;
var BackWheelRTMid : WheelCollider;


var FrontWheelCenter : WheelCollider; //sam: added slot from front wheel
var FrontWheelLTOuter : WheelCollider;//sam:adding extra colliders to add thickness
var FrontWheelRTOuter : WheelCollider;
var FrontWheelLTMid : WheelCollider;
var FrontWheelRTMid : WheelCollider;

// These variables are for the gears, the array is the list of ratios. The script
// uses the defined gear ratios to determine how much torque to apply to the wheels.
var GearRatio : float[];
var CurrentGear : int = 0;

// These variables are just for applying torque to the wheels and shifting gears.
// using the defined Max and Min Engine RPM, the script can determine what gear the
// car needs to be in.
var EngineTorque : float = 600.0;
var MaxEngineRPM : float = 3000.0;
var MinEngineRPM : float = 1000.0;
private var EngineRPM : float = 0.0;

//sam: variable to reference bike body angle
var BIKE : Transform;

//making center of mass public
var centerOfMass = -1.5;

function Start () {
	// I usually alter the center of mass to make the car more stable. I'ts less likely to flip this way.
	rigidbody.centerOfMass.y = centerOfMass;
}

function Update () 
{
	// This is to limith the maximum speed of the car, adjusting the drag probably isn't the best way of doing it,
	// but it's easy, and it doesn't interfere with the physics processing.
	rigidbody.drag = rigidbody.velocity.magnitude / 250;	
	EngineRPM = BackWheelCenter.rpm * GearRatio[CurrentGear]; // Compute the engine RPM based on the average RPM of the two wheels, then call the shift gear function
	ShiftGears();
	
	// set the audio pitch to the percentage of RPM to the maximum RPM plus one, this makes the sound play
	// up to twice it's pitch, where it will suddenly drop when it switches gears.
	audio.pitch = Mathf.Abs(EngineRPM / MaxEngineRPM) + 1.0 ;
	// this line is just to ensure that the pitch does not reach a value higher than is desired.
	if ( audio.pitch > 2.0 ) 
	{
		audio.pitch = 2.0;
	}

	// finally, apply the values to the wheels.	The torque applied is divided by the current gear, and
	// multiplied by the user input variable.a
	if (Input.GetAxis("Vertical") > 0  && BackWheelCenter.rpm >= 0 && BackWheelCenter.motorTorque >= 0) //vertical input is positive then apply torque
	{
	
		Debug.Log ("Forward", gameObject);
		BackWheelCenter.motorTorque = EngineTorque / GearRatio[CurrentGear] * Input.GetAxis("Vertical");
	}
	
	if (Input.GetAxis("Vertical") < 0 && BackWheelCenter.rpm > 0 && BackWheelCenter.motorTorque >= 0)//figure out whether to apply breaks
	{
		Brake();
		Debug.Log ("Braking", gameObject);
	}
	else if (Input.GetAxis("Vertical") < 0 && BackWheelCenter.rpm <= 0)//figure out whether to reverse
	{
		CurrentGear = 0;
		BackWheelCenter.motorTorque = (EngineTorque / GearRatio[CurrentGear] * Input.GetAxis("Vertical"))*.25;
		Debug.Log ("Reverse", gameObject);
		
	}
	
	//zero out torque if you're done reversing over time.
	if ( BackWheelCenter.motorTorque < 0 && Input.GetAxis("Vertical") >= 0 && BackWheelCenter.rpm == 0) //gradually reset torque back to zero if it's negative
	{
		if (BackWheelCenter.motorTorque < -.5)
		{
			BackWheelCenter.motorTorque = 0;
		}
		else
		{
		BackWheelCenter.motorTorque = Mathf.InverseLerp(BackWheelCenter.motorTorque, 0, 10 * Time.deltaTime);
		Debug.Log ("Torque Disappating" + BackWheelCenter.motorTorque, gameObject);
		Debug.Log ("CurrentVerticalInput: " + Input.GetAxis("Vertical"), gameObject);
		}
	}
	//zero out torque if going forward over time
	else if (Input.GetAxis("Vertical") == 0  && BackWheelCenter.rpm >= 0 && BackWheelCenter.motorTorque >= 0)
	{
		if (BackWheelCenter.motorTorque < -.5)
		{
			BackWheelCenter.motorTorque = 0;
		}
		else
		{
			BackWheelCenter.motorTorque = Mathf.InverseLerp(BackWheelCenter.motorTorque, 0, 10 * Time.deltaTime);
			Debug.Log ("Torque Disappating" + BackWheelCenter.motorTorque, gameObject);
			Debug.Log ("CurrentVerticalInput: " + Input.GetAxis("Vertical"), gameObject);
		}
	}

	SetBackWheelChildrenTorque(); //set children back wheel torque to follow center wheel
	Debug.Log ("Current RPM :" + BackWheelCenter.rpm, gameObject);
	Debug.Log ("Current Torque :" + BackWheelCenter.motorTorque, gameObject);

	SetSteerAngle(); 	// the steer angle is an arbitrary value multiplied by the user input. amount of steering affecting direction dissipates as RPM increases
	SetFrontWheelChildrenAngle(); // sam: set other parts of front wheel to mimic steer angle of center wheel collider	
}
	
 //FixedUpdate should be used instead of Update when dealing with Rigidbody. 
function FixedUpdate ()
{
	//Debug.Log ("Vector3.up is currently:" + BIKE.up, gameObject);
	if	(BackWheelCenter.isGrounded == true) //if back wheel is touching ground, let tilt be driven by horizontal input tempered by speed
	{
		BIKE.rotation.eulerAngles.z = Mathf.LerpAngle(BIKE.rotation.eulerAngles.z, -30 * Input.GetAxis("Horizontal") * (BackWheelCenter.rpm / MaxEngineRPM), 5 * Time.deltaTime);
	}
	//This script attempts to keep bike upright
	else if ( Vector3.Angle( Vector3.up, BIKE.up ) < 30) 
	{ //if the angle between the bike.up vector and the vertical vector up is less than 30 degrees
    	BIKE.rotation = Quaternion.Slerp( BIKE.rotation, Quaternion.Euler( 0, BIKE.rotation.eulerAngles.y, 0 ), Time.deltaTime * 5 ); //set the bike rotation equal to : spherical interpolation from "current bike rotation" towards "
	}
}


/*********************
**Utility Functions:**
**********************/
function ShiftGears() {
	// this function shifts the gears of the vehcile, it loops through all the gears, checking which will make
	// the engine RPM fall within the desired range. The gear is then set to this "appropriate" value.
	if ( EngineRPM >= MaxEngineRPM ) {
		var AppropriateGear : int = CurrentGear;
		
		for ( var i = 0; i < GearRatio.length; i ++ ) {
			if ( BackWheelCenter.rpm * GearRatio[i] < MaxEngineRPM ) {
				AppropriateGear = i;
				break;
			}
		}
		
		CurrentGear = AppropriateGear;
	}
	
	if ( EngineRPM <= MinEngineRPM ) {
		AppropriateGear = CurrentGear;
		
		for ( var j = GearRatio.length-1; j >= 0; j -- ) {
			if ( BackWheelCenter.rpm * GearRatio[j] > MinEngineRPM ) {
				AppropriateGear = j;
				break;
			}
		}
		
		CurrentGear = AppropriateGear;
	}
}

function SetBackWheelChildrenTorque() 	//sam: Set all other parts of back tire to equal torque of center
{
	BackWheelLTOuter.motorTorque = BackWheelCenter.motorTorque ;
	BackWheelRTOuter.motorTorque = BackWheelCenter.motorTorque ;
	BackWheelLTMid.motorTorque = BackWheelCenter.motorTorque ;
	BackWheelRTMid.motorTorque = BackWheelCenter.motorTorque ;
}

function SetFrontWheelChildrenAngle()
{
	FrontWheelLTOuter.steerAngle = FrontWheelCenter.steerAngle;
	FrontWheelRTOuter.steerAngle = FrontWheelCenter.steerAngle;
	FrontWheelLTMid.steerAngle = FrontWheelCenter.steerAngle;
	FrontWheelRTMid.steerAngle = FrontWheelCenter.steerAngle;
}

function SetSteerAngle()
{
	// the steer angle is an arbitrary value multiplied by the user input.
	//default multiple was 10
	//trying to make this steer less at high speeds.
	//MaxEngineRPM tr
	//original: FrontWheelCenter.steerAngle = 60 * Input.GetAxis("Horizontal");
	//after a certain speed bike explodes on impact
	
	if (BackWheelCenter.rpm < 100)
	{
		FrontWheelCenter.steerAngle = 60 * Input.GetAxis("Horizontal") ;
	}
	else if(BackWheelCenter.rpm >= 100 && BackWheelCenter.rpm < 200)
	{
		FrontWheelCenter.steerAngle = 50 * Input.GetAxis("Horizontal") ;
	}
	else if(BackWheelCenter.rpm >= 200 && BackWheelCenter.rpm < 300)
	{
		FrontWheelCenter.steerAngle = 40 * Input.GetAxis("Horizontal") ;
	}
	else if(BackWheelCenter.rpm >= 300 && BackWheelCenter.rpm < 400)
	{
		FrontWheelCenter.steerAngle = 30 * Input.GetAxis("Horizontal") ;
	}
	else if(BackWheelCenter.rpm >= 400 && BackWheelCenter.rpm < 500)
	{
		FrontWheelCenter.steerAngle = 20 * Input.GetAxis("Horizontal") ;
	}
	else if(BackWheelCenter.rpm >= 500 && BackWheelCenter.rpm < 600)
	{
		FrontWheelCenter.steerAngle = 20 * Input.GetAxis("Horizontal") ;
	}
	else if(BackWheelCenter.rpm >= 600 && BackWheelCenter.rpm < 700)
	{
		FrontWheelCenter.steerAngle = 10 * Input.GetAxis("Horizontal") ;
	}
	else if(BackWheelCenter.rpm >= 700 && BackWheelCenter.rpm < 800)
	{
		FrontWheelCenter.steerAngle = 5 * Input.GetAxis("Horizontal") ;
	}
		else
	{
		FrontWheelCenter.steerAngle = 2 * Input.GetAxis("Horizontal") ;
	}
	//Debug.Log ("Current SteerAngle :" + FrontWheelCenter.steerAngle, gameObject);
}
function Brake()
{
	BackWheelCenter.brakeTorque = 100 * Mathf.Abs(Input.GetAxis("Vertical")); //apply brake to all wheels based on user input
	
	//update other parts of wheel
	BackWheelLTOuter.brakeTorque = BackWheelCenter.brakeTorque ;
	BackWheelRTOuter.brakeTorque = BackWheelCenter.brakeTorque ;
	BackWheelLTMid.brakeTorque = BackWheelCenter.brakeTorque ;
	BackWheelRTMid.brakeTorque = BackWheelCenter.brakeTorque ;
		
	FrontWheelCenter.brakeTorque = BackWheelCenter.brakeTorque ;
	FrontWheelLTOuter.brakeTorque = BackWheelCenter.brakeTorque ;
	FrontWheelRTOuter.brakeTorque = BackWheelCenter.brakeTorque ;
	FrontWheelLTMid.brakeTorque = BackWheelCenter.brakeTorque ;
	FrontWheelRTMid.brakeTorque = BackWheelCenter.brakeTorque ;
}



/*
 As you may see bike wheel has a round tire. And this is the main reason why bike is turning. 
 Not because of rotation of front wheel(honestly, it's main reason of lean) but because of lean.
  So, I've made few standard Unity wheel controllers "around" my mesh wheel and changing it by javascript while leaning.


//the plan: at low speeds. affect week angle. 
// at high speeds change to this hack where joystick input controls lean and has very subtle affect on wheel 

if ( bikeXangle > = 10 && bikeXangle <20) { // bow Vlevo from 10 to 20 degrees , L1 wheel ( 10 degrees )
 currentRearWheel = rearWheelL1 ; }
 if ( bikeXangle > = 20 && bikeXangle <30) { / / bow Vlevo from 20 to 30 degrees , L2 wheel ( 10 degrees )
 currentRearWheel = rearWheelL2 ; }
 if ( bikeXangle > = 30 && bikeXangle <42 ) { / / bow Vlevo from 30 to 42 degrees , wheel L3 ( 12 degrees )
 currentRearWheel = rearWheelL3 ; }
 if ( bikeXangle > = 42 && bikeXangle <60 ) { / / bow Vlevo from 42 to 60 degrees , wheel L4 ( 18 degrees )
 currentRearWheel = rearWheelL4 ; }
 / / For Front Wheel Cut inye inclination values ​​, Tak as just 3 extra tires
 if ( bikeXangle > = 10 && bikeXangle <24 ) {
 currentFrontWheel = frontWheelL1 ; }
 if ( bikeXangle > = 24 && bikeXangle < 40 ) {
 currentFrontWheel = frontWheelL2 ; }
 if ( bikeXangle > = 40 && bikeXangle <60 ) {
 currentFrontWheel = frontWheelL3 ; }
*/