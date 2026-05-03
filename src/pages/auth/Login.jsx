import { useState } from "react"
import { auth, db } from "../../firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc,getDoc } from "firebase/firestore"
import { useNavigate,Link } from "react-router-dom"
import "../../styles/auth.css"

function Login(){

const navigate = useNavigate()

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [error,setError] = useState("")

async function login(e){

e.preventDefault()
setError("")

try{

const cred = await signInWithEmailAndPassword(auth,email,password)

const snap = await getDoc(doc(db,"users",cred.user.uid))

if(snap.data().status === "banned"){
setError("Your account is banned")
return
}

navigate("/dashboard")

}catch(err){
setError("Invalid login credentials")
}

}

return(

<div className="auth-container">

<div className="auth-left">
<h1>Creator Platform</h1>
<p>Login to your dashboard</p>
</div>

<div className="auth-right">

<div className="auth-card">

<h2>Login</h2>

{error && <div className="auth-error">{error}</div>}

<form onSubmit={login}>

<input
className="auth-input"
placeholder="Email"
onChange={(e)=>setEmail(e.target.value)}
/>

<input
type="password"
className="auth-input"
placeholder="Password"
onChange={(e)=>setPassword(e.target.value)}
/>

<button className="auth-btn">Login</button>

</form>

<div className="auth-link">
Don't have an account? <Link to="/register">Register</Link>
</div>

</div>

</div>

</div>

)

}

export default Login