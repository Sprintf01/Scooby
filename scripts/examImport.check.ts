// Runnable self-check for importing timetable picks into the exam page.
//   node scripts/examImport.check.ts
import assert from "node:assert";
import { myCourseCodes, timetableCodes, examsForCodes } from "../src/lib/examImport.ts";
import type { Course, Exam } from "../src/lib/types.ts";

const ex = (courseCode: string, slot: "morning" | "afternoon" = "morning"): Exam =>
	({ courseCode, date: "Dec 4", day: "Friday", time: "9:00 AM", slot });
const row = (courseCode: string, major: string, courseType = "Major Core") =>
	({ courseCode, major, courseType }) as Course;

// Batch courses come from the sheet, not from the saved list
const all = [
	row("ECE301-LEC1", "ECE3YR"),
	row("ECE301-TUT1", "ECE3YR"),
	row("ECE302-LEC1", "ECE3YR"),
	row("ECE303-LEC1", "ECE3YR"), // excluded below
	row("ECE304-LEC1", "ECE3YR"), // swapped below
	row("ECE365-LEC1", "ECE3YR", "Major Elective"), // opt-in, not part of the batch
	row("CSD101-LEC1", "CSE1YR"), // someone else's batch
];
const codes = myCourseCodes(all, {
	batches: ["ece36"],
	selected: [{ courseCode: "CHY111/CHY1011-LEC1" }],
	excluded: ["ECE303-LEC1"],
	swapped: [["ECE304-LEC1", "ECE399-LEC1"]],
});
assert.deepStrictEqual(codes.sort(), ["CHY111/CHY1011-LEC1", "ECE301-LEC1", "ECE301-TUT1", "ECE302-LEC1", "ECE399-LEC1"]);

// No batch: just what was added by hand
assert.deepStrictEqual(myCourseCodes(all, { batches: [], selected: [{ courseCode: "X1-LEC1" }], excluded: [], swapped: [] }), ["X1-LEC1"]);

// Sections collapse; aliases stay together
assert.deepStrictEqual(timetableCodes(codes.sort()), [["CHY111", "CHY1011"], ["ECE301"], ["ECE302"], ["ECE399"]]);

// Both aliases are on the sheet: import only one so it doesn't self-conflict
const exams = [ex("CHY1011"), ex("CHY111"), ex("FAC1006-ECE301", "afternoon"), ex("MAT101")];
assert.deepStrictEqual(
	examsForCodes(timetableCodes(codes), exams).map((e) => e.courseCode),
	["CHY1011", "FAC1006-ECE301"]
);
console.log("examImport ok");
