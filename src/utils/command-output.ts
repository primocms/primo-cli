// Commands keep one JSON document on stdout; existing diagnostic helpers and
// spinners remain visible on stderr. Restore console even when a command fails.
export async function with_command_output<T>(
	json: boolean | undefined,
	run: () => Promise<T>
): Promise<T> {
	const log = console.log
	if (json) console.log = (...args: unknown[]) => console.error(...args)
	try {
		return await run()
	} finally {
		console.log = log
	}
}
