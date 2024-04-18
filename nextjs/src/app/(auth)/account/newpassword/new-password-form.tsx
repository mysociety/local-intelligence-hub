"use client";

import { OperationVariables, gql, useMutation } from "@apollo/client";
import { useForm } from "react-hook-form";
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const PERFORM_PASSWORD_RESET_MUTATION = gql`
  mutation PerformPasswordReset($token: String!, $password1: String!, $password2: String!) {
    performPasswordReset(token: $token, newPassword1: $password1, newPassword2: $password2) {
      errors
      success
    }
  }
`;

export default function NewPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams?.get('token');

    // TODO make this schema more secure
    const passwordSchema = z.object({
        password1: z.string().min(8, { message: "Password must be at least 8 characters long." }),
        password2: z.string().min(8, { message: "Password must be at least 8 characters long." }),
    }).refine(data => data.password1 === data.password2, {
        message: "Passwords must match.",
        path: ["password2"],
    });

    const form = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password1: '',
            password2: '',
        }
    });

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("error"); 

    const handleCompleted = (data: { performPasswordReset: { success: any; }; }) => {
        const success = data?.performPasswordReset?.success;
        if (success) {
            form.reset();
            setMessage("Your password has been successfully reset. You can now <a href='/login'><em>log in</em></a> with your new password.");
            setMessageType("success");
        }
    };

    const handleError = () => {
        setMessage("Request failed, please try again later.");
        setMessageType("error");
    };

    const [performPasswordReset, { loading }] = useMutation(PERFORM_PASSWORD_RESET_MUTATION, {
        onCompleted: handleCompleted,
        onError: handleError
    });

    const handleSubmit = async (values: OperationVariables | undefined) => {
        await performPasswordReset({ variables: { ...values, token } });
    };

    console.log('message', message, 'messagetype', messageType)
    return (
        <Form {...form}>
            <form className="pb-4 flex flex-col space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                    control={form.control}
                    name="password1"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Enter new password" {...field} />
                            </FormControl>
                            {form.formState.errors.password1 && (
                                <p className="text-destructive">{String(form.formState.errors.password1?.message || '')}</p>
                            )}
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password2"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Confirm new password" {...field} />
                            </FormControl>
                            {form.formState.errors.password2 && (
                                <p className="text-destructive">{String(form.formState.errors.password2?.message || '')}</p>
                            )}
                        </FormItem>
                    )}
                />

                <FormMessage
                    className={messageType === 'success'? "text-meepGray-100" : ""}
                    htmlContent={message}
                />
                {messageType !== 'success' && (
                    <Button variant='reverse' type="submit" disabled={loading}>Reset Password</Button>
                )}


            </form>
        </Form>
    );
}