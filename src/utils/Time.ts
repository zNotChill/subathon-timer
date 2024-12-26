export function formattedDurationToSeconds(duration: string): number {
	const split = duration.split(":")
	let returnSeconds = 0;

	if (split.length === 3) {
		const hours = parseInt(split[0])
		const minutes = parseInt(split[1])
		const seconds = parseInt(split[2])
		returnSeconds += hours * 60 * 60
		returnSeconds += minutes * 60
		returnSeconds += seconds
	} else if (split.length === 2) {
		const minutes = parseInt(split[0])
		const seconds = parseInt(split[1])
		returnSeconds += minutes * 60
		returnSeconds += seconds
	}

	return returnSeconds
}

export function formattedDurationsToSeconds(durations: string[], operation: "add" | "subtract"): number {
	let returnSeconds = 0;

	durations.forEach((dur, i) => {
		const seconds = formattedDurationToSeconds(dur)

		if (i === 0) returnSeconds = seconds

		if (i >= 0) {
			switch (operation) {
				case "subtract": returnSeconds -= seconds; break;
			}
		}
	})

	returnSeconds = Math.abs(returnSeconds);

	return returnSeconds;
}