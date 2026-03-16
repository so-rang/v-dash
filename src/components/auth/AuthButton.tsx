'use client';

import { useState, useEffect } from 'react';
import { googleSignIn, googleSignOut } from '@/app/actions/auth';
import { LogIn, LogOut } from 'lucide-react';

interface AuthButtonProps {
    collapsed?: boolean;
}

export default function AuthButton({ collapsed }: AuthButtonProps) {
    const [session, setSession] = useState<{ user?: { name?: string; email?: string; image?: string } } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (data?.user) {
                    setSession(data);
                } else {
                    setSession(null);
                }
            })
            .catch(() => setSession(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="auth-btn auth-btn--loading">
                <div className="auth-btn__spinner" />
                {!collapsed && <span>로딩중...</span>}
            </div>
        );
    }

    if (session?.user) {
        return (
            <div className="auth-btn auth-btn--logged-in">
                <div className="auth-btn__user">
                    {session.user.image ? (
                        <img src={session.user.image} alt="" className="auth-btn__avatar" referrerPolicy="no-referrer" />
                    ) : (
                        <div className="auth-btn__avatar auth-btn__avatar--placeholder">
                            {session.user.name?.[0] || '?'}
                        </div>
                    )}
                    {!collapsed && (
                        <div className="auth-btn__info">
                            <span className="auth-btn__name">{session.user.name}</span>
                            <span className="auth-btn__email">{session.user.email}</span>
                        </div>
                    )}
                </div>
                <button
                    className="auth-btn__action"
                    onClick={() => googleSignOut()}
                    title="로그아웃"
                >
                    <LogOut size={16} />
                </button>
            </div>
        );
    }

    return (
        <button
            className="auth-btn auth-btn--sign-in"
            onClick={() => googleSignIn()}
            title="Google 계정으로 로그인"
        >
            <LogIn size={18} />
            {!collapsed && <span>Google 로그인</span>}
        </button>
    );
}
