<script>
	import Header from '../blocks/Header.svelte'
	import PageHeader from '../blocks/PageHeader.svelte'
	import ContactForm from '../blocks/ContactForm.svelte'
	import BasicContent from '../blocks/BasicContent.svelte'
	import Footer from '../blocks/Footer.svelte'
</script>

	<Header logo={{"type":"text","text":"SaaSify","image":{"url":"","alt":""}}} nav_links={[{"link":{"label":"Features","url":"#features"}},{"link":{"label":"Pricing","url":"#pricing"}},{"link":{"label":"About","url":"/about"}},{"link":{"label":"Contact","url":"/contact"}}]} header_cta={{"label":"Get Started","url":"#signup"}} />
	<PageHeader title={"Contact Us"} subtitle={"We'd love to hear from you."} />
	<ContactForm title={"Send us a message"} subtitle={"Fill out the form below and we'll get back to you within 24 hours."} />
	<BasicContent content={"<h2>Other ways to reach us</h2>\n<p><strong>Email:</strong> <a href=\"mailto:hello@saasify.com\">hello@saasify.com</a></p>\n<p><strong>Twitter:</strong> <a href=\"https://twitter.com/saasify\">@saasify</a></p>\n<p><strong>Support:</strong> <a href=\"mailto:support@saasify.com\">support@saasify.com</a></p>\n"} />
	<Footer logo={{"type":"text","text":"SaaSify","image":{"url":"","alt":""}}} tagline={"The all-in-one platform that helps your team build, deploy, and scale applications without the complexity."} social_links={[{"platform":"twitter","url":"https://twitter.com/saasify"},{"platform":"linkedin","url":"https://linkedin.com/company/saasify"},{"platform":"github","url":"https://github.com/saasify"}]} footer_link_groups={[{"title":"Product","links":[{"link":{"label":"Features","url":"#features"}},{"link":{"label":"Pricing","url":"#pricing"}},{"link":{"label":"Changelog","url":"/changelog"}}]},{"title":"Company","links":[{"link":{"label":"About","url":"/about"}},{"link":{"label":"Blog","url":"/blog"}},{"link":{"label":"Contact","url":"/contact"}}]},{"title":"Legal","links":[{"link":{"label":"Privacy","url":"/privacy"}},{"link":{"label":"Terms","url":"/terms"}}]}]} copyright={"© 2026 SaaSify. All rights reserved."} />
