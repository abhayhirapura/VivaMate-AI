import { v4 as uuidv4 } from 'uuid';

const KEY = 'vivamate_student_id';

export function getStudentId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(KEY, id);
  }
  return id;
}
