'use client';
import { siteConfig } from '@/lib/home';
import { AnimatedBg } from '@/components/home/ui/AnimatedBg';
import { useIsMobile } from '@/hooks/utils';
import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { BillingModal } from '@/components/billing/billing-modal';
import GitHubSignIn from '@/components/GithubSignIn';
import { ChatInput, ChatInputHandles } from '@/components/thread/chat-input/chat-input';
import { normalizeFilenameToNFC } from '@/lib/utils/unicode';
import { createQueryHook } from '@/hooks/use-query';

// Constant for localStorage key to ensure consistency
const PENDING_PROMPT_KEY = 'pendingAgentPrompt';



export function HeroSection() {
    const { hero } = siteConfig;
    const isMobile = useIsMobile();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputValue, setInputValue] = useState('');

    // Use centralized agent selection hook with persistence
    // const { selectedAgentId, setSelectedAgent } = useAgentSelection();

    // Use centralized Suna modes persistence hook
    // const { mode, setMode } = useSunaModePersistence();
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    // const initiateAgentMutation = useInitiateAgentMutation();
    const [initiatedThreadId, setInitiatedThreadId] = useState<string | null>(null);
    // const threadQuery = useThreadQuery(initiatedThreadId || '');
    const chatInputRef = useRef<ChatInputHandles>(null);
    const [showAgentLimitDialog, setShowAgentLimitDialog] = useState(false);
    const [agentLimitData, setAgentLimitData] = useState<{
        runningCount: number;
        runningThreadIds: string[];
    } | null>(null);

    // Fetch agents for selection
    const { data: agentsResponse } = createQueryHook(
        [],
        () => Promise.resolve()
    )();

    // Type guard for agentsResponse
    const agents = [];

    // Initialize agent selection from agents list
    useEffect(() => {
        if (agents.length > 0) {
            // initializeFromAgents(agents, undefined, setSelectedAgent);
        }
    }, [agents, /* initializeFromAgents, setSelectedAgent */]);

    // Determine if selected agent is Suna default
    // For unauthenticated users, assume Suna is the default
    // const selectedAgent = selectedAgentId
    //     ? agents.find(agent => agent.agent_id === selectedAgentId)
    //     : null;
    // const isSunaAgent = !user || selectedAgent?.metadata?.is_suna_default || false;

    // Auth dialog state
    const [authDialogOpen, setAuthDialogOpen] = useState(false);

    useEffect(() => {
        if (authDialogOpen && inputValue.trim()) {
            localStorage.setItem(PENDING_PROMPT_KEY, inputValue.trim());
        }
    }, [authDialogOpen, inputValue]);

    useEffect(() => {
        if (authDialogOpen && user && !isLoading) {
            setAuthDialogOpen(false);
            router.push('/dashboard');
        }
    }, [user, isLoading, authDialogOpen, router]);

    useEffect(() => {
        // if (threadQuery.data && initiatedThreadId) {
        //     const thread = threadQuery.data;
        //     if (thread.project_id) {
        //         router.push(`/projects/${thread.project_id}/thread/${initiatedThreadId}`);
        //     } else {
        //         router.push(`/agents/${initiatedThreadId}`);
        //     }
        //     setInitiatedThreadId(null);
        // }
    }, [/* threadQuery.data, */ initiatedThreadId, router]);

    // Handle ChatInput submission
    const handleChatInputSubmit = async (
        message: string,
        options?: { model_name?: string; enable_thinking?: boolean }
    ) => {
        if ((!message.trim() && !chatInputRef.current?.getPendingFiles().length) || isSubmitting) return;

        // If user is not logged in, save prompt and show auth dialog
        if (!user && !isLoading) {
            localStorage.setItem(PENDING_PROMPT_KEY, message.trim());
            setAuthDialogOpen(true);
            return;
        }

        // User is logged in, create the agent with files like dashboard does
        setIsSubmitting(true);
        try {
            const files = chatInputRef.current?.getPendingFiles() || [];
            localStorage.removeItem(PENDING_PROMPT_KEY);

            const formData = new FormData();
            formData.append('prompt', message);

            // Add selected agent if one is chosen
            // if (selectedAgentId) {
            //     formData.append('agent_id', selectedAgentId);
            // }

            // Add files if any
            files.forEach((file) => {
                const normalizedName = normalizeFilenameToNFC(file.name);
                formData.append('files', file, normalizedName);
            });

            if (options?.model_name) formData.append('model_name', options.model_name);
            formData.append('enable_thinking', String(options?.enable_thinking ?? false));
            formData.append('reasoning_effort', 'low');
            formData.append('stream', 'true');
            formData.append('enable_context_manager', 'false');

            // const result = await initiateAgentMutation.mutateAsync(formData);

            // if (result.thread_id) {
            //     setInitiatedThreadId(result.thread_id);
            // } else {
            //     throw new Error('Agent initiation did not return a thread_id.');
            // }

            chatInputRef.current?.clearPendingFiles();
            setInputValue('');
        } catch (error: any) {
            const isConnectionError =
                error instanceof TypeError &&
                error.message.includes('Failed to fetch');
            toast.error(
                error.message || 'Failed to create agent. Please try again.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="relative flex flex-col items-center justify-center overflow-hidden text-center">
            <AnimatedBg />
            <div className="container relative z-10 py-16">
                <div className="mx-auto max-w-3xl">
                    <h1 className="mb-4 text-4xl font-extrabold leading-tight sm:text-5xl">
                        {hero.title}
                    </h1>
                    <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
                        {hero.description}
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <Link
                            href="/dashboard"
                            className="inline-block rounded-lg bg-primary px-6 py-3 text-center text-white transition-all hover:bg-primary/90"
                        >
                            {'Start Free'}
                        </Link>
                        <Link
                            href="/agents/explore"
                            className="inline-block rounded-lg bg-muted px-6 py-3 text-center transition-all hover:bg-muted/80"
                        >
                            Explore Agents
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}