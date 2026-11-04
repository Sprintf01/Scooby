import type { Course, Exam } from "./types.ts";
import { offeredTo, isMajorElective } from "./types.ts";

// What the timetable manager persists (see CollisionChecker.svelte). Batch
// courses are NOT saved as a list; they're derived from the batch each load.
export interface SavedTimetable {
	batches: string[]; // scooby_batches_kept
	selected: { courseCode: string }[]; // scooby_<v>_selected, courses added by hand
	excluded: string[]; // scooby_<v>_excluded, batch courses dropped
	swapped: [string, string][]; // scooby_<v>_swapped, batch course -> replacement
}

// Mirrors batchCourses + getEffectiveCoursesList in the timetable manager.
export function myCourseCodes(all: Course[], saved: SavedTimetable): string[] {
	const batches = saved.batches.map((b) => b.toUpperCase().trim()).filter(Boolean);
	const excluded = new Set(saved.excluded);
	const swapped = new Map(saved.swapped);
	const codes = new Set<string>();
	if (batches.length)
		for (const c of all)
			if (offeredTo(c, batches) && !isMajorElective(c) && !excluded.has(c.courseCode))
				codes.add(swapped.get(c.courseCode) ?? c.courseCode);
	for (const c of saved.selected) codes.add(c.courseCode);
	return [...codes];
}

// Codes look like "CHY111/CHY1011-LEC1": cross-listed aliases, then the section.
export function timetableCodes(courseCodes: string[]): string[][] {
	const seen = new Map<string, string[]>();
	for (const code of courseCodes) {
		const base = code.replace(/-[A-Z]+\d*$/i, "").toUpperCase().replace(/\s/g, "");
		if (base) seen.set(base, base.split("/"));
	}
	return [...seen.values()];
}

// One exam per timetable course: the first alias the exam sheet knows about.
export function examsForCodes(courses: string[][], exams: Exam[]): Exam[] {
	const out: Exam[] = [];
	for (const aliases of courses) {
		const hit = exams.find((e) => e.courseCode.toUpperCase().split(/[-/]/).some((p) => aliases.includes(p)));
		if (hit && !out.includes(hit)) out.push(hit);
	}
	return out;
}

// Reads the timetable manager's keys from localStorage, whatever its STORE_VERSION.
export function readSavedTimetable(storage: Storage): SavedTimetable {
	const get = <T>(key: string | undefined, fallback: T): T => {
		try {
			const raw = key ? storage.getItem(key) : null;
			return raw ? JSON.parse(raw) : fallback;
		} catch {
			return fallback;
		}
	};
	const keys = Object.keys(storage);
	const versioned = (suffix: string) => keys.find((k) => k.startsWith("scooby_") && k.endsWith(`_${suffix}`) && k !== "scooby_batches_kept");
	return {
		batches: get("scooby_batches_kept", []),
		selected: get(versioned("selected"), []),
		excluded: get(versioned("excluded"), []),
		swapped: get(versioned("swapped"), []),
	};
}
