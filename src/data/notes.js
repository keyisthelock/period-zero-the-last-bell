// All readable documents and key items in one place (data-driven narrative).
export const NOTES = {
  // Chapter 1
  clock: { id: 'clock', title: 'Wall Clock', body: 'The second hand trembles in place, ticking without moving on.\n\nThe clock reads 3:47.\n\nAs if it is still waiting for a bell that already rang.' },
  chalkboard: { id: 'chalkboard', title: 'Chalkboard', style: 'chalk', body: 'DETENTION — ROOM 104\n\nLATE IS ABSENT.\nABSENT IS GONE.\n\nYou will be dismissed at the last bell.' },
  carving: { id: 'carving', title: 'Carved Desk', body: 'Letters cut deep into the wood with a compass point, gone over again and again:\n\n    M.H.   14/10\n    I WAS HERE\n    I WAS HERE\n    I WAS HERE' },
  register: { id: 'register', title: 'Class Register 1994–95, Room 104', body: 'An old attendance register. Neat ticks in green ink.\n\nOne page has been cut out with a blade, close to the spine.\nThe stub of the page still shows a date:  14 OCT 1994.\n\nOn the next page, the names start again as if nothing was missing.' },
  caretaker: { id: 'caretaker', title: 'Notice Beside the Door', body: 'AFTER HOURS\n\nAll doors lock automatically at the last bell.\nRe-entry code = the time the last bell rang (4 digits, HHMM).\n\nDo NOT remain on the premises after the last bell.\n— R. Okafor, Caretaker' },
  slip: { id: 'slip_note', title: 'Detention Slip', body: 'DETENTION SLIP\n\nStudent: Arin Price, Year 11\nReason: Late. Again.\nReport to: Room 104, final period.\n\nYou will be dismissed at the last bell.\nSigned: E. Voss, Headmaster' },
  // Chapter 2
  maintlog: { id: 'maintlog', title: 'Maintenance Log (Caretaker)', body: 'POWER RESTORE — EAST CORRIDOR\n(Written after the October \'94 outage. Follow it EXACTLY.)\n\n1. LIGHTING first. You cannot work in the dark.\n2. DOORS second. The mag-locks need the lighting circuit live.\n3. ALARM last. If the alarm comes up before the doors,\n   it seals the wing and trips every breaker back to zero.\n\nThat is what happened on the 14th. Never again.\n— R.O.' },
  trophy: { id: 'trophy', title: 'Trophy Case', body: 'A tarnished plaque behind cracked glass:\n\nPERFECT ATTENDANCE AWARD 1993–94\nPresented to Headmaster E. Voss\n"Not one student missing. Not one."\n\nSomeone has scratched a small tally mark beside the word "one".' },
  // Chapter 3
  cipher: { id: 'cipher', title: 'Note on the Librarian\'s Desk', body: 'Ms. Adebayo says my cipher is childish. Fine.\n\nEvery letter on my bookmarks steps BACK by the hour the last bell rang.\nRead them in order of volume: I, II, III, IV.\n\nIf anyone finds this — that\'s my name. Don\'t let him take it.\n— M.' },
  photo: { id: 'photo', title: 'Class Photo — Year 10, 1994', body: 'Twenty-nine smiling faces in three rows.\n\nIn the back row, a thirtieth face has been scratched out down to the paper.\n\nThe caption lists twenty-nine names.' },
  card: { id: 'card', title: 'Library Card #0104', body: 'LIBRARY CARD\nName: MIRA HALE\nYear 10 — Form 10B\n\nSTATUS: CANCELLED 15/10/1994\nReason: "Student record removed by order of the Headmaster."\n\nOn the back, in pencil: "detention again. rm 104. he says I\'ll learn."' },
  // Chapter 4
  notebook: { id: 'notebook', title: 'Burnt Lab Notebook', style: 'burnt', body: 'VENT PURGE — keyed in the order of the fire itself:\n\nFirst, what starts it.\nThen, what fights it.\nThen, what it leaves behind.\nLast, what rises.\n\n(Sigils as per the Lab Standard 7 chart on the north wall.)' },
  sigils: { id: 'sigils', title: 'Compound Sigils — Lab Standard 7', body: '△   EMBER — the spark\n▽   TIDE — water, the quench\n○   ASH — what remains\n◇   VEIL — smoke, vapour\n□   ROOT — earth, base\n⊕   VESSEL — the container' },
  report: { id: 'report', title: 'Fire Inspectorate — Incident 94/117', body: 'Date: 14 October 1994\nOrigin: Science Wing, Lab 3, approx. 15:40\nAlarm & final bell: 15:47\n\nFINDINGS: East and basement exits chained shut from the inside.\nHeadmaster E. Voss states the chains were "to stop truancy during final period."\nHeadmaster states the building was empty: "Attendance confirms every student left at the bell."\n\nHandwritten: The detention log for Room 104 lists ONE student present.\nThe register page for 14/10 has been removed. Recommend inquiry.\n\n[STAMPED]  FILE CLOSED — NO FURTHER ACTION' },
  // Chapter 5
  halefile: { id: 'halefile', title: 'Student File: HALE, M.', body: 'The folder is empty.\n\nNo photograph. No reports. No address.\nOnly a small brass key taped inside the cover, labelled in red ink:\n\n    REGISTER CAGE' },
};

export const ITEMS = {
  slip: { id: 'slip', name: 'Detention Slip', desc: 'Arin Price — Room 104. "You will be dismissed at the last bell."' },
  flashlight: { id: 'flashlight', name: 'Flashlight', desc: 'Heavy, old, still works. Press F.' },
  volI: { id: 'volI', name: 'Red Book, Vol. I', desc: 'Bookmark letter: K' },
  volII: { id: 'volII', name: 'Red Book, Vol. II', desc: 'Bookmark letter: D' },
  volIII: { id: 'volIII', name: 'Red Book, Vol. III', desc: 'Bookmark letter: O' },
  volIV: { id: 'volIV', name: 'Red Book, Vol. IV', desc: 'Bookmark letter: H' },
  report: { id: 'reportItem', name: 'Inspection Report', desc: 'Incident 94/117 — 14 Oct 1994, last bell 15:47. "ONE student present."' },
  key: { id: 'cageKey', name: 'Brass Key', desc: 'Labelled "REGISTER CAGE". Found in Mira Hale\'s empty file.' },
};
