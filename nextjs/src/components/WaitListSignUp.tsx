import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"

const MailchimpForm = () => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [secondName, setSecondName] = useState('');
    const [organisationName, setOrganisationName] = useState('');
    const [role, setRole] = useState('');
    const [heardAboutMapped, setHeardAboutMapped] = useState('');
    const [whyMappedUseful, setWhyMappedUseful] = useState('');
    const [message, setMessage] = useState('');

    const formActionURL = 'https://commonknowledge.us19.list-manage.com/subscribe/post?u=7d61a70102ab811e6282bee60&amp;id=b87cfcec60&amp;f_id=00788fe4f0';

    return (
        <>
            {message ? (
                <div>{message}</div>
            ) : (
                <form className="pb-4 flex flex-col space-y-4" action={formActionURL} method="POST" target="_blank">
                    <label htmlFor="firstName">First Name</label>
                    <Input id="firstName" name="FNAME" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <label htmlFor="secondName">Second Name</label>
                    <Input id="secondName" name="LNAME" value={secondName} onChange={(e) => setSecondName(e.target.value)} />
                    <label htmlFor="email">Email</label>
                    <Input id="email" name="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <label htmlFor="organisationName">Main organisation name</label>
                    <Input id="organisationName" name="ORG" value={organisationName} onChange={(e) => setOrganisationName(e.target.value)} />
                    <label htmlFor="role">What's your role?</label>
                    <Input id="role" name="ROLE" value={role} onChange={(e) => setRole(e.target.value)} />
                    <label htmlFor="heardAboutMapped">How did you hear about Mapped?</label>
                    <Input id="heardAboutMapped" name="MAP_REFER" value={heardAboutMapped} onChange={(e) => setHeardAboutMapped(e.target.value)} />
                    <label htmlFor="whyMappedUseful">Why would Mapped be useful to you?</label>
                    <Input id="whyMappedUseful" name="MAP_NEEDS" value={whyMappedUseful} onChange={(e) => setWhyMappedUseful(e.target.value)} />
                    <Button
                        variant="outline"
                        onSubmit={() => {
                            setMessage('Thank you for joining the waitlist');
                        }}
                    >
                        Sign up to the waitlist
                    </Button>
                </form>
            )}
        </>
    );
};
export default MailchimpForm;