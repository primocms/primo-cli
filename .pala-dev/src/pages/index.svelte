<script>
	import Hero from '../blocks/Hero.svelte'
	import BuiltFor from '../blocks/BuiltFor.svelte'
	import Testimonials from '../blocks/Testimonials.svelte'
	import HowItWorks from '../blocks/HowItWorks.svelte'
	import Problem from '../blocks/Problem.svelte'
	import CompatibleWith from '../blocks/CompatibleWith.svelte'
	import Features from '../blocks/Features.svelte'
	import Bridge from '../blocks/Bridge.svelte'
	import Cta from '../blocks/Cta.svelte'
	import SiteFooter from '../blocks/SiteFooter.svelte'
</script>

	<Hero cta_primary={{"label":"Get Started","url":"https://docs.palacms.com/getting-started/installation"}} cta_secondary={{"label":"See how it works","url":"#how-it-works"}} github_stars={"2,300+ GitHub stars"} github_url={"https://github.com/palacms/palacms"} headline={"Build sites with"} headline_highlight={"your AI agent."} headline_suffix={"Manage them visually."} name={"GitHub Copilot"} subheadline={"Pala represents your entire site as files. Pull it down, edit with Claude Code, Cursor, or any agent, push it back. Your team manages content visually in the browser."} text={"MIT License"} />
	<BuiltFor text={"<p>Built for <em>developers who build sites for other people</em> — freelancers, agencies, and small teams who want full code control without leaving their clients stranded.</p>"} />
	<Testimonials label={"From the community"} name={"Alex Rivera"} quote={"The file-based approach is genius. I can version control everything and deploy with confidence."} role={"Senior Engineer, TechStartup"} title={"People are building with Pala."} />
	<HowItWorks description={"Run `pala push` to sync your changes. Your team sees updates instantly in the visual editor."} label={"How it works"} number={3} title={"Push changes back"} />
	<Problem text_1={"<p>Every CMS makes you choose. Visual builders give editors freedom but <strong>lock developers out of the code</strong>. Developer frameworks give you control but <strong>leave your team staring at a repo they can't use</strong>. Headless CMSes promise both but deliver <strong>months of glue work</strong>.</p>"} text_2={"<p>Your site should be something your team edits visually <strong>and</strong> something on your filesystem that any tool can modify. Not one or the other. Both.</p>"} />
	<CompatibleWith icon={"🔧"} label={"Compatible with"} name={"Any CLI tool"} tagline={"<p>No integrations. No plugins. You run <code>npx pala pull</code>, your site becomes files, and every tool in your stack just works.</p>"} title={"Any agent that can edit files can edit your site."} />
	<Features description={"Run Pala on your own infrastructure. Your data never leaves your servers."} icon={"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/></svg>"} label={"Everything you'd expect"} title={"Self-Hosted"} />
	<Bridge text={"<p>Everything you'd expect from a CMS - <em>visual editing, collaboration, publishing</em> - plus everything you wouldn't: <em>your entire site as local files, editable by any tool in your stack</em>.</p>"} />
	<Cta command={"docker run -d -p 8080:8080 ghcr.io/palacms/palacms:latest"} description={"Self-hosted. Open source. Free."} link={{"label":"GitHub","url":"https://github.com/palacms/palacms"}} title={"Start building."} />
	<SiteFooter link={{"label":"Discord","url":"https://discord.gg/palacms"}} text={"Pala - open source"} />
