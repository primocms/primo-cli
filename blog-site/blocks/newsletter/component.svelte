<script>
let form_state = $state('idle')
let form_element = $state(null)

async function handle_submit(event) {
	event.preventDefault()
	if (!endpoint) return

	form_state = 'submitting'
	const form_data = new FormData(event.target)

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			body: form_data
		})

		if (response.ok) {
			form_state = 'success'
			form_element.reset()
			setTimeout(() => form_state = 'idle', 5000)
		} else {
			form_state = 'error'
			setTimeout(() => form_state = 'idle', 5000)
		}
	} catch (error) {
		form_state = 'error'
		setTimeout(() => form_state = 'idle', 5000)
	}
}
</script>

<section class="newsletter">
	<div class="container">
		<div class="newsletter-content">
			{#if title}
				<h2>{title}</h2>
			{/if}
			{#if description}
				<p class="description">{description}</p>
			{/if}
		</div>

		<form onsubmit={handle_submit} bind:this={form_element} class="newsletter-form">
			<div class="form-group">
				<input
					type="email"
					name="email"
					placeholder={placeholder || 'Enter your email'}
					required
					disabled={form_state === 'submitting'}
				/>
				<button type="submit" disabled={form_state === 'submitting'}>
					{#if form_state === 'submitting'}
						<span class="spinner"></span>
					{:else}
						{button_text || 'Subscribe'}
					{/if}
				</button>
			</div>

			{#if form_state === 'success'}
				<div class="message success">
					{success_message || 'Thanks for subscribing!'}
				</div>
			{/if}

			{#if form_state === 'error'}
				<div class="message error">
					Something went wrong. Please try again.
				</div>
			{/if}

			{#if privacy_text}
				<p class="privacy">{privacy_text}</p>
			{/if}
		</form>
	</div>
</section>

<style>
.newsletter {
	padding: var(--theme-section-padding, 5rem) 0;
	background: var(--theme-primary, #6366f1);
}

.container {
	max-width: 800px;
	margin: 0 auto;
	padding: 0 1.5rem;
	text-align: center;
}

.newsletter-content {
	margin-bottom: 2rem;
}

h2 {
	font-family: var(--theme-heading-font, 'Georgia', serif);
	font-size: clamp(1.75rem, 4vw, 2.5rem);
	font-weight: 700;
	color: white;
	margin: 0 0 1rem;
}

.description {
	font-size: 1.125rem;
	color: rgba(255, 255, 255, 0.9);
	margin: 0;
	line-height: 1.6;
}

.newsletter-form {
	max-width: 500px;
	margin: 0 auto;
}

.form-group {
	display: flex;
	gap: 0.75rem;
	background: white;
	padding: 0.5rem;
	border-radius: 12px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

input[type="email"] {
	flex: 1;
	padding: 1rem 1.25rem;
	border: none;
	background: transparent;
	font-size: 1rem;
	color: var(--theme-text, #1a1a2e);
	outline: none;
}

input[type="email"]::placeholder {
	color: var(--theme-text-muted, #94a3b8);
}

button {
	padding: 1rem 2rem;
	background: var(--theme-text, #1a1a2e);
	color: white;
	border: none;
	border-radius: 8px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 140px;
}

button:hover:not(:disabled) {
	background: #2d2d44;
	transform: translateY(-1px);
}

button:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.spinner {
	width: 20px;
	height: 20px;
	border: 2px solid transparent;
	border-top-color: white;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.message {
	margin-top: 1rem;
	padding: 0.75rem 1rem;
	border-radius: 8px;
	font-size: 0.9375rem;
	font-weight: 500;
}

.message.success {
	background: rgba(255, 255, 255, 0.15);
	color: white;
}

.message.error {
	background: rgba(239, 68, 68, 0.2);
	color: #fecaca;
}

.privacy {
	margin-top: 1rem;
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 640px) {
	.form-group {
		flex-direction: column;
		padding: 1rem;
	}

	input[type="email"] {
		padding: 1rem;
	}

	button {
		width: 100%;
	}
}
</style>
