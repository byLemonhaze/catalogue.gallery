import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useEmbedCheck } from './useEmbedCheck';
import { applicationErrors, normalizeWebsiteUrl, thumbnailError } from '../../shared/submission';

export function useApplicationForm() {
    const [formData, setFormData] = useState({
        name: '',
        subtitle: '',
        websiteUrl: '',
        email: '',
        type: 'artist' as 'artist' | 'gallery' | 'collector'
    });
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [attempted, setAttempted] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const submitting = useRef(false);
    const embedCheck = useEmbedCheck(formData.websiteUrl);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const validation = applicationErrors(formData, thumbnailFile);
    const hasFieldErrors = Object.keys(validation).length > 0;
    const fieldErrors = attempted ? validation : {};
    const canSubmit = !hasFieldErrors && embedCheck.status === 'compatible' && !isSubmitting;
    // Missing details may be clicked to reveal every error, but are never sent.
    const submitDisabled = isSubmitting || (!hasFieldErrors && embedCheck.status !== 'compatible');

    useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        const error = thumbnailError(file);
        setImageError(error);
        setThumbnailFile(error ? null : file);
        setPreviewUrl(!error && file ? URL.createObjectURL(file) : null);
        if (error) e.target.value = '';
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (formData.type === 'collector' || submitting.current) return;
        setAttempted(true);
        if (hasFieldErrors) {
            setStatus({ type: 'error', message: 'Please complete the highlighted fields.' });
            const firstField = Object.keys(validation)[0];
            const input = e.currentTarget.querySelector<HTMLInputElement>(`[name="${firstField}"]`);
            input?.focus();
            return;
        }
        if (!canSubmit) return;
        submitting.current = true;

        const normalizedEmail = formData.email.trim();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name.trim());
            submitData.append('subtitle', formData.subtitle.trim());
            submitData.append('websiteUrl', normalizeWebsiteUrl(formData.websiteUrl));
            submitData.append('email', normalizedEmail);
            submitData.append('type', formData.type);
            if (thumbnailFile) {
                submitData.append('thumbnail', thumbnailFile);
            }

            const response = await fetch('/api/submit', {
                method: 'POST',
                body: submitData
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.embedStatus) embedCheck.recheck();
                throw new Error(result.error || 'Submission failed');
            }

            setStatus({ type: 'success', message: 'Application received. We will be in touch shortly.' });
            setFormData({ name: '', subtitle: '', websiteUrl: '', email: '', type: formData.type });
            setAttempted(false);
            setThumbnailFile(null);
            setPreviewUrl(null);
            setImageError(null);
            if (fileInput.current) fileInput.current.value = '';

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Submission failed';
            const isCorsError = message === 'Failed to fetch' || (err instanceof TypeError);
            setStatus({
                type: 'error',
                message: isCorsError ? 'Network error. Please check your connection and try again.' : message
            });
        } finally {
            submitting.current = false;
            setIsSubmitting(false);
        }
    };

    return { formData, setFormData, previewUrl, imageError: imageError || fieldErrors.thumbnail, fieldErrors, fileInput, embedCheck, isSubmitting, status, submitDisabled, handleFileChange, handleSubmit };
}
