import { useState } from "react";
function Register() {
    /* const [name, setName] = useState("");
       const [email, setEmail] = useState("");     instead we can follow a state object that holds all registration information
       const [phone, setPhone] = useState();
       const [role, setRole] =useState();*/

    const [formData, setFormData] = useState(
        {
            name: "",
            email: "",
            phone: "",
            organization: "",
            designation: "",
            country: "",
            role: "",
            researchDomain: "",
            password: "",
        }
    );




    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    /*checking purpose only*/
    console.log(formData);
    return (
        <>


            <div className="register-page">

                <div className="register-container">
                    {/**left */}
                    <section className="register-intro">
                        <p className="platform-label" >Research Intelligence Platform</p>

                        <h1>Build your Profile
                            <br />

                            With us.

                        </h1>

                        <p className="intro-description">Create your account to access research funding opportunities, innovation intelligence and tehnology insights tailored to your professional journey!</p>

                    </section>

                    {/* right side registration form*/}
                    <section className="register-card">
                        <div className="register-head">
                            <h2>Create your account</h2>
                            <p>
                                Start by sharing a few details about yourself and your work.
                            </p>
                        </div>

                        {/*form content starts here */}
                        <form className="register-form"
                            onSubmit={(event) => event.preventDefault()}

                        >
                            <div className="form-section">
                                <h3>Personal Information</h3>

                                <div className="form-group">
                                    <label htmlFor="name">Full name</label>

                                    {/*input area starts */}

                                    <input type="text" id="name" placeholder="Enter your full name"
                                        name="name"
                                   
                                        value={formData.name}
                                        onChange={handleChange}


                                    />


                                </div>

                                {/*email address*/}

                                <div className="form-group">
                                    <label htmlFor="email           ">Email address    </label>

                                    <input type="email  " id="email" placeholder="you@mail.com" 
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    
                                    />

                                </div>

                                {/*phone */}
                                <div className="form-group" >
                                    <label htmlFor="phone"   >Phone          </label>
                                    <input type="tel " id="phone" placeholder="enter 10 digit phone number   " 
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    
                                    
                                    />
                                </div>
                            </div>
                            {/*end of personal info    */}


                            {/** start of perfessional info        */}

                            <div className="form-section">
                                <h3>Professional information</h3>

                                {/* Organization here */}

                                <div className="form-group"  >

                                    <label htmlFor="organ   ">Organization   </label>

                                    <input type="text" id="organ" placeholder="University, company ,institution " 
                                    name="organ"
                                    value={formData.organ}
                                    onChange={handleChange}
                                    
                                    />
                                </div>


                                {/**designation            */}

                                <div className="form-group"      >

                                    <label htmlFor="designation">Designation</label>
                                    <input type="text" id="designation" placeholder="your current role" 
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    
                                    
                                    />

                                </div>



                                {/*country details */}

                                <div className="form-group">

                                    <label htmlFor="country">Country</label>
                                    <input type="text" id="country" placeholder="enter your country" 
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    
                                    />

                                </div>{/*end of professional */}
                            </div>

                            {/** start of new section ACCOUNT DETAILS */}
                            <div className="form-section">

                                <h3>Account Information</h3>

                                <div className="form-group">

                                    <label htmlFor="role">Account role</label>
                                    <select id="role"name="role" value={formData.role} onChange={handleChange} >
                                        <option value="">select your role</option>
                                        <option value="researcher">Researcher</option>
                                        <option value="startup-founder">Startup Founder</option>
                                        <option value="innovation-manager">Innovation Manager</option>

                                        
                                    </select>
                                </div>

                            </div>{/**end of account information */}


                            {/**start of research domain group*/}
                            <div className="form-group">
                                <label htmlFor="research-domain">
                                    Primary research or innovation domain
                                </label>

                                <input
                                    id="research-domain"
                                    type="text"
                                    placeholder="e.g. Artificial Intelligence, Healthcare, Energy"
                                    name="researchDomain"
                                    value={formData.researchDomain}
                                    onChange={handleChange}


                                />


                            </div>



                            {/**password section */}

                            <div className="form-section">
                                <h3>Secure your account</h3>

                                <div className="form-group">
                                    <label htmlFor="password">Password</label>

                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="Create a secure password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}


                                    />
                                </div>
                            </div>

                            {/** creat amount btn */}
                            <button type="submit" className="register-button">
                                Create account
                            </button>





























                        </form>

                        <p className="login-text">
                            Already have an account?
                            <span className="login-link"> Sign in</span>
                        </p>
                    </section>

                </div>
            </div>

        </>


    );
}

export default Register;