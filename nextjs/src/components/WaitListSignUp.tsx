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
    const [message, setMessage] = useState("");

    const handleSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        let url = 'https://commonknowledge.us19.list-manage.com/subscribe/post?u=7d61a70102ab811e6282bee60&amp;id=b87cfcec60&amp;f_id=00788fe4f0';
        url = `${url}&EMAIL=${email}&FNAME=${firstName}&MMERGE3=${organisationName}&MMERGE4=${role}&MMERGE5=${heardAboutMapped}&MMERGE6=${whyMappedUseful}`
        fetch(url, {
            method: "post",
            mode: 'no-cors'
        }).then((r) => {
            console.log('response', r)
            setMessage('Thank you for signing up!');
        })
            .catch((e) => {
                console.log('error', e)
            })
    };

    return (
        <>
            {!message &&
                <form className="pb-4 flex flex-col space-y-4" onSubmit={handleSubmit}>
                    <label htmlFor="firstName">First Name</label>
                    <Input id="firstName" required={true} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <label htmlFor="secondName">Second Name</label>
                    <Input id="secondName" value={secondName} onChange={(e) => setSecondName(e.target.value)} />
                    <label htmlFor="email">Email</label>
                    <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <label htmlFor="organisationName">Main organisation name</label>
                    <Input id="organisationName" value={organisationName} onChange={(e) => setOrganisationName(e.target.value)} />
                    <label htmlFor="role">What{"'"}s your role?</label>
                    <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
                    <label htmlFor="heardAboutMapped">How did you hear about Mapped?</label>
                    <Input id="heardAboutMapped" value={heardAboutMapped} onChange={(e) => setHeardAboutMapped(e.target.value)} />
                    <label htmlFor="whyMappedUseful">Why would Mapped be useful to you?</label>
                    <Input id="whyMappedUseful" value={whyMappedUseful} onChange={(e) => setWhyMappedUseful(e.target.value)} />
                    <Button size='sm'>
                        Sign up to the waitlist
                    </Button>
                </form>
            }
            {message && <p>{message}</p>}
        </>
    );
};

export default MailchimpForm;