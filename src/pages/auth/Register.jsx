import { useState } from "react"
import { auth, db } from "../../firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc,setDoc } from "firebase/firestore"
import { useNavigate,Link } from "react-router-dom"
import "../../styles/auth.css"

function Register(){

const navigate = useNavigate()

const [error,setError] = useState("")
const [form,setForm] = useState({
username:"",
email:"",
phone:"",
telegram:"",
followers:"",
platform:"",
password:"",
confirmPassword:""
})

function handleChange(e){
setForm({...form,[e.target.name]:e.target.value})
}

async function handleSubmit(e){

e.preventDefault()
setError("")

if(form.password !== form.confirmPassword){
setError("Passwords do not match")
return
}

try{

const cred = await createUserWithEmailAndPassword(
auth,
form.email,
form.password
)

await setDoc(doc(db,"users",cred.user.uid),{

username:form.username,
email:form.email,
phone:form.phone,
telegram:form.telegram,
followers:form.followers,
platform:form.platform,
emailVerified:false,
status:"active",
createdAt:new Date()

})

navigate("/dashboard")

}catch(err){
setError(err.message)
}

}

return(

<div className="auth-container">

<div className="auth-left">
<h1>Creator Platform</h1>
<p>Stream Donations & Alerts</p>
</div>

<div className="auth-right">

<div className="auth-card">

<h2>Create Account</h2>

{error && <div className="auth-error">{error}</div>}

<form onSubmit={handleSubmit}>

<input className="auth-input" name="username" placeholder="Username" onChange={handleChange}/>

<input className="auth-input" name="email" placeholder="Email" onChange={handleChange}/>

<input className="auth-input" name="phone" placeholder="Phone" onChange={handleChange}/>

<input className="auth-input" name="telegram" placeholder="Telegram Username" onChange={handleChange}/>

<input className="auth-input" name="followers" placeholder="Followers" onChange={handleChange}/>

<select className="auth-input" name="platform" onChange={handleChange}>
<option value="">Platform</option>
<option>TikTok</option>
<option>Twitch</option>
<option>Kick</option>
<option>YouTube</option>
<option>Facebook</option>
</select>

<input type="password" className="auth-input" name="password" placeholder="Password" onChange={handleChange}/>

<input type="password" className="auth-input" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange}/>

<button className="auth-btn">Create Account</button>

</form>

<div className="auth-link">
Already have an account? <Link to="/login">Login</Link>
</div>

</div>

</div>

</div>

)

}

export default Register