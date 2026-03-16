'use client';

import { useState } from 'react';
import { useChannelStore } from '@/store/channel-store';
import { Settings, Pencil, Check, Youtube, Calendar, HardDrive, MessageSquare, Link2, Unlink } from 'lucide-react';
import type { Channel, PersonaConfig } from '@/types/channel';

interface ChannelConnections {
    youtube: string;
    calendar: string;
    drive: string;
    chat: string;
}

export default function SettingsView() {
    const { channels, setChannels } = useChannelStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Channel & { personaConfig: PersonaConfig }>>({});

    // 연결 상태 관리 (채널 ID → 연결 정보)
    const [connections, setConnections] = useState<Record<string, ChannelConnections>>(() => {
        const init: Record<string, ChannelConnections> = {};
        channels.forEach(ch => {
            init[ch.id] = {
                youtube: ch.youtubeChannelId || '',
                calendar: '',
                drive: ch.driveRootPath || '',
                chat: '',
            };
        });
        return init;
    });
    const [editingConnection, setEditingConnection] = useState<{ channelId: string; field: keyof ChannelConnections } | null>(null);
    const [connectionInput, setConnectionInput] = useState('');

    const startEdit = (channel: Channel) => {
        setEditingId(channel.id);
        setEditData({
            displayName: channel.displayName,
            driveRootPath: channel.driveRootPath,
            personaConfig: channel.personaConfig ? { ...channel.personaConfig } : undefined,
        });
    };

    const saveEdit = (channelId: string) => {
        const updatedChannels = channels.map(ch => {
            if (ch.id !== channelId) return ch;
            return {
                ...ch,
                displayName: editData.displayName || ch.displayName,
                driveRootPath: editData.driveRootPath || ch.driveRootPath,
                personaConfig: editData.personaConfig || ch.personaConfig,
            };
        });
        setChannels(updatedChannels);
        setEditingId(null);
    };

    const updatePersona = (field: keyof PersonaConfig, value: PersonaConfig[keyof PersonaConfig]) => {
        setEditData(prev => ({
            ...prev,
            personaConfig: {
                ...prev.personaConfig!,
                [field]: value,
            },
        }));
    };

    const startConnectionEdit = (channelId: string, field: keyof ChannelConnections) => {
        setEditingConnection({ channelId, field });
        setConnectionInput(connections[channelId]?.[field] || '');
    };

    const saveConnection = () => {
        if (!editingConnection) return;
        const { channelId, field } = editingConnection;
        setConnections(prev => ({
            ...prev,
            [channelId]: {
                ...prev[channelId],
                [field]: connectionInput.trim(),
            },
        }));

        // YouTube 또는 Drive인경우 채널 데이터도 업데이트
        if (field === 'youtube' || field === 'drive') {
            const updatedChannels = channels.map(ch => {
                if (ch.id !== channelId) return ch;
                return {
                    ...ch,
                    ...(field === 'youtube' ? { youtubeChannelId: connectionInput.trim() } : {}),
                    ...(field === 'drive' ? { driveRootPath: connectionInput.trim() } : {}),
                };
            });
            setChannels(updatedChannels);
        }

        setEditingConnection(null);
        setConnectionInput('');
    };

    const disconnectService = (channelId: string, field: keyof ChannelConnections) => {
        setConnections(prev => ({
            ...prev,
            [channelId]: {
                ...prev[channelId],
                [field]: '',
            },
        }));
    };

    const CONNECTION_ITEMS: { key: keyof ChannelConnections; label: string; icon: typeof Youtube; placeholder: string; recommended?: boolean }[] = [
        { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: '@채널핸들 또는 채널 ID' },
        { key: 'calendar', label: 'Google Calendar', icon: Calendar, placeholder: '캘린더 ID (예: xxx@group.calendar.google.com)', recommended: true },
        { key: 'drive', label: 'Google Drive', icon: HardDrive, placeholder: '감시 폴더 경로 (예: /V-Dash/채널명/Upload_Waiting)' },
        { key: 'chat', label: 'Google Chat', icon: MessageSquare, placeholder: '웹훅 URL' },
    ];

    return (
        <div className="settings-view">
            <div className="settings-view__header">
                <h1 className="settings-view__title">
                    <Settings size={24} />
                    채널 설정
                </h1>
                <p className="settings-view__subtitle">채널별 페르소나, API 연동 및 서비스 연결 설정</p>
            </div>

            <div className="settings-view__grid">
                {channels.map(channel => {
                    const isEditing = editingId === channel.id;
                    const persona = isEditing ? editData.personaConfig : channel.personaConfig;
                    const channelConns = connections[channel.id] || { youtube: '', calendar: '', drive: '', chat: '' };

                    return (
                        <div key={channel.id} className="settings-card">
                            <div className="settings-card__header">
                                <div style={{ flex: 1 }}>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editData.displayName || ''}
                                            onChange={e => setEditData({ ...editData, displayName: e.target.value })}
                                            style={{ fontSize: 16, fontWeight: 600 }}
                                        />
                                    ) : (
                                        <h3>{channel.displayName}</h3>
                                    )}
                                    <span className="settings-card__id">{channel.youtubeChannelId}</span>
                                </div>
                                {isEditing ? (
                                    <button className="btn btn--primary" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => saveEdit(channel.id)}>
                                        <Check size={14} /> 저장
                                    </button>
                                ) : (
                                    <button className="btn btn--secondary" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => startEdit(channel)}>
                                        <Pencil size={14} /> 수정
                                    </button>
                                )}
                            </div>

                            {/* 서비스 연결 */}
                            <div className="settings-card__section">
                                <h4 className="settings-card__section-title">🔗 서비스 연결</h4>
                                <div className="settings-connections-grid">
                                    {CONNECTION_ITEMS.map(({ key, label, icon: Icon, placeholder, recommended }) => {
                                        const isConnected = Boolean(channelConns[key]);
                                        const isEditingThis = editingConnection?.channelId === channel.id && editingConnection?.field === key;

                                        return (
                                            <div key={key} className="settings-connection">
                                                <span className={`settings-connection__dot ${isConnected ? 'settings-connection__dot--connected' : 'settings-connection__dot--disconnected'}`} />
                                                <Icon size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                                <span className="settings-connection__label">
                                                    {label}
                                                    {recommended && <span className="settings-connection__recommended">⚡ 추천</span>}
                                                </span>
                                                {isEditingThis ? (
                                                    <>
                                                        <input
                                                            className="settings-connection__input"
                                                            value={connectionInput}
                                                            onChange={e => setConnectionInput(e.target.value)}
                                                            placeholder={placeholder}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveConnection(); }}
                                                            autoFocus
                                                        />
                                                        <button className="settings-connection__action" onClick={saveConnection}>저장</button>
                                                    </>
                                                ) : isConnected ? (
                                                    <>
                                                        <span className="settings-connection__value truncate">{channelConns[key]}</span>
                                                        <button
                                                            className="settings-connection__action--disconnect settings-connection__action"
                                                            onClick={() => disconnectService(channel.id, key)}
                                                        >
                                                            <Unlink size={10} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="settings-connection__action"
                                                        onClick={() => startConnectionEdit(channel.id, key)}
                                                    >
                                                        <Link2 size={10} /> 연결
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {persona && (
                                <div className="settings-card__section">
                                    <h4 className="settings-card__section-title">페르소나</h4>
                                    <div className="settings-card__fields">
                                        <div className="settings-field">
                                            <span className="settings-field__label">어투</span>
                                            {isEditing ? (
                                                <select
                                                    className="form-input"
                                                    value={persona.tone}
                                                    onChange={e => updatePersona('tone', e.target.value as PersonaConfig['tone'])}
                                                    style={{ fontSize: 13, padding: '4px 8px' }}
                                                >
                                                    <option value="casual">구어체</option>
                                                    <option value="formal">문어체</option>
                                                    <option value="mixed">혼합</option>
                                                </select>
                                            ) : (
                                                <span className="settings-field__value">
                                                    {persona.tone === 'casual' ? '구어체' : persona.tone === 'formal' ? '문어체' : '혼합'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="settings-field">
                                            <span className="settings-field__label">타겟</span>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={persona.targetAudience}
                                                    onChange={e => updatePersona('targetAudience', e.target.value)}
                                                    style={{ fontSize: 13, padding: '4px 8px' }}
                                                />
                                            ) : (
                                                <span className="settings-field__value">{persona.targetAudience}</span>
                                            )}
                                        </div>
                                        <div className="settings-field">
                                            <span className="settings-field__label">정보 밀도</span>
                                            <div className="settings-field__meter">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div
                                                        key={i}
                                                        className={`settings-field__dot ${i <= persona.informationDensity ? 'settings-field__dot--active' : ''} ${isEditing ? 'settings-field__dot--clickable' : ''}`}
                                                        onClick={isEditing ? () => updatePersona('informationDensity', i) : undefined}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="settings-field">
                                            <span className="settings-field__label">감정 톤</span>
                                            <div className="settings-field__meter">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div
                                                        key={i}
                                                        className={`settings-field__dot ${i <= persona.emotionTone ? 'settings-field__dot--active-warm' : ''} ${isEditing ? 'settings-field__dot--clickable' : ''}`}
                                                        onClick={isEditing ? () => updatePersona('emotionTone', i) : undefined}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="settings-field">
                                            <span className="settings-field__label">선호 단어</span>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={persona.preferredWords.join(', ')}
                                                    onChange={e => updatePersona('preferredWords', e.target.value.split(',').map(w => w.trim()).filter(Boolean))}
                                                    style={{ fontSize: 13, padding: '4px 8px' }}
                                                />
                                            ) : (
                                                <div className="settings-field__tags">
                                                    {persona.preferredWords.map(w => (
                                                        <span key={w} className="settings-field__tag">{w}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {persona?.footerText && (
                                <div className="settings-card__section">
                                    <h4 className="settings-card__section-title">고정 설명 (Footer)</h4>
                                    {isEditing ? (
                                        <textarea
                                            className="form-textarea"
                                            value={persona.footerText}
                                            onChange={e => updatePersona('footerText', e.target.value)}
                                            rows={2}
                                            style={{ fontSize: 13 }}
                                        />
                                    ) : (
                                        <p className="settings-card__footer-text">{persona.footerText}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
