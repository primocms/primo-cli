import { hosted_targets, type HostedOptions } from '../utils/hosted-targets.js'
import {
	publish_target,
	print_publication_result,
	type PublicationResult
} from '../utils/publication.js'
import { with_command_output } from '../utils/command-output.js'

export async function publish_site(options: HostedOptions) {
	const results: {
		target: string
		server: string
		site_id: string
		publish: PublicationResult
	}[] = []
	let error: string | undefined
	await with_command_output(options.json, async () => {
		try {
			const targets = await hosted_targets(options)
			for (const target of targets) {
				const publish = await publish_target(target)
				results.push({
					target: target.label,
					server: target.server,
					site_id: target.target,
					publish
				})
				if (!options.json) print_publication_result(target.label, publish)
			}
		} catch (cause) {
			error = cause instanceof Error ? cause.message : String(cause)
			if (!options.json) console.error(error)
		}
	})
	const ok =
		!error && results.every((result) => result.publish.state === 'succeeded')
	if (!ok) process.exitCode = 1
	if (options.json)
		console.log(
			JSON.stringify(
				{
					ok,
					results,
					...(error ? { error, error_code: 'invalid_publication_target' } : {})
				},
				null,
				2
			)
		)
	return results
}
