import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import apiClient from '@/apiclient';
import { AxiosError } from 'axios';
import Logo from '@/layouts/Logo';
import { Button } from '@/components/ui/button';

const PasswordResetRequestPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await apiClient.post(
                '/users/request-password-reset/',
                {
                    email_or_phone_number: email,
                    email: email,
                    phone_number: '',
                    password: '',
                }
            );

            if (response.data.success) {
                setSuccess(true);
                setError(null);
                navigate('/reset-password');
            } else {
                setError(response.data.message || 'Failed to send password reset request.');
            }
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            setError(axiosError.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#4588B2]">
            <div className="bg-white p-10 w-1/2 mx-auto rounded-lg shadow-md flex flex-col gap-6 max-lg:w-11/12">
                <Logo />
                <p className="text-2xl font-bold text-gray-800 mb-2 text-center">Welcome back</p>
                <p className="text-lg text-gray-800 mb-2 text-center">Login to Continue</p>

                {success ? (
                    <div className="text-center text-green-600">
                        Password reset instructions have been sent to your email.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        {error && (
                            <div className="text-red-600 text-sm mb-4">
                                {error}
                            </div>
                        )}
                        <div className="flex items-left justify-between mt-4">

                            <a className="text-sm text-gray-800 font-bold">
                                Back to
                                <span
                                    className="text-sm text-blue-600 hover:underline cursor-pointer ml-2 font-bold"
                                    onClick={() => navigate("/login")}
                                >
                                    Login
                                </span>
                            </a>

                        </div>
                        <div className="flex items-center justify-between">
                            <Button
                                type="submit"
                                className="w-full bg-[#4588B2] text-white py-2 rounded-md hover:bg-[#4588B2] focus:outline-none focus:ring-2 focus:ring-blue-500 mt-12"
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Continue'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PasswordResetRequestPage;