import { supabase } from './supabase';

export function getDirectImageUrl(url?: string | null): string {
  if (!url || !url.trim()) return '';
  const trimmed = url.trim();

  // Handle Google Drive share link (e.g. /file/d/FILE_ID/view or ?id=FILE_ID)
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  return trimmed;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  duration: string;
  class_count: number;
  days_of_week: string[];
  timings: string;
  fees: number;
  qr_code_url?: string;
  created_at?: string;
}

export interface Batch {
  id: string;
  course_id: string;
  name: string;
  mentor_id?: string | null;
  google_meet_link?: string;
  start_date: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'mentor' | 'admin' | 'core';
  dob?: string;
  contact_number?: string;
  specialization?: string;
  referral_code?: string;
  referred_by_id?: string | null;
  created_at?: string;
  password?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface Wallet {
  id: string;
  student_id: string;
  balance: number;
  created_at?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  batch_id: string;
  course_id: string;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  amount_paid: number;
  transaction_id?: string;
  referred_by_id?: string | null;
  created_at?: string;
}

export interface Redemption {
  id: string;
  student_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  payment_phone: string;
  created_at?: string;
  processed_at?: string;
}

// -------------------------------------------------------------
// LOCAL STORAGE SIMULATOR (for Instant Demo Mode)
// -------------------------------------------------------------
const INITIAL_COURSES: Course[] = [
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Full-Stack Web Development',
    description: 'Master Next.js, React, Node.js, and SQL databases in this comprehensive program.',
    duration: '1 Month',
    class_count: 16,
    days_of_week: ['Monday', 'Wednesday', 'Friday'],
    timings: '6:00 PM - 8:00 PM',
    fees: 9999.00,
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=univision@ybl%26pn=Univision%2520Counsel%26am=9999%26cu=INR'
  },
  {
    id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    name: 'UI/UX Design Mastery',
    description: 'Learn wireframing, prototyping, Figma, and human-computer interaction principles.',
    duration: '1 Month',
    class_count: 12,
    days_of_week: ['Tuesday', 'Thursday'],
    timings: '7:00 PM - 9:00 PM',
    fees: 5999.00,
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=univision@ybl%26pn=Univision%2520Counsel%26am=5999%26cu=INR'
  },
  {
    id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    name: 'Data Science & Machine Learning',
    description: 'Dive into Python, Pandas, NumPy, Scikit-Learn, and basic neural networks.',
    duration: '1 Month',
    class_count: 20,
    days_of_week: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
    timings: '5:00 PM - 7:00 PM',
    fees: 12999.00,
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=univision@ybl%26pn=Univision%2520Counsel%26am=12999%26cu=INR'
  }
];

const INITIAL_BATCHES: Batch[] = [
  {
    id: 'b1-webdev',
    course_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Batch Alpha',
    google_meet_link: 'https://meet.google.com/abc-defg-hij',
    start_date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'b2-webdev',
    course_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Batch Beta',
    google_meet_link: 'https://meet.google.com/xyz-uvwx-yza',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  {
    id: 'b1-uiux',
    course_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    name: 'UI Batch 1',
    google_meet_link: 'https://meet.google.com/fig-ma12-des',
    start_date: new Date().toISOString().split('T')[0]
  }
];

const INITIAL_MENTORS: Profile[] = [
  {
    id: 'mentor-1',
    name: 'Mohamed Jaris',
    email: 'jaris@univisioncounsel.com',
    role: 'mentor',
    dob: '2004-08-15',
    contact_number: '+91 8438304400',
    specialization: 'Full-Stack Web Development'
  }
];

const INITIAL_ADMINS: Profile[] = [
  {
    id: 'admin-1',
    name: 'Mohamed Jaris (CEO & Founder)',
    email: 'univisioncounsel@gmail.com',
    role: 'admin',
    dob: '2004-08-15',
    contact_number: '+91 8438304400'
  }
];

const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
};

const setLocalStorage = <T>(key: string, value: T) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// -------------------------------------------------------------
// DATABASE SERVICE IMPLEMENTATION
// -------------------------------------------------------------
export const db = {
  isSupabaseLive(): boolean {
    return supabase !== null;
  },

  getSupabaseClient() {
    return supabase;
  },

  // --- Courses ---
  async getCourses(): Promise<Course[]> {
    if (supabase) {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as Course[];
      console.error('Supabase getCourses error:', error);
    }
    return getLocalStorage<Course[]>('univision_courses', INITIAL_COURSES);
  },

  async getCourseById(id: string): Promise<Course | null> {
    if (supabase) {
      const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();
      if (!error && data) return data as Course;
      console.error('Supabase getCourseById error:', error);
    }
    const courses = getLocalStorage<Course[]>('univision_courses', INITIAL_COURSES);
    return courses.find(c => c.id === id) || null;
  },

  async addCourse(course: Omit<Course, 'id'>): Promise<Course> {
    const newId = crypto.randomUUID();
    
    // Auto-generate UPI QR code URL if none is provided
    let finalQrUrl = course.qr_code_url;
    if (!finalQrUrl || finalQrUrl.trim() === '') {
      const upiString = `upi://pay?pa=univisioncounsel@gmail.com&pn=Univision%20Counsel&am=${course.fees}&cu=INR`;
      finalQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;
    }

    const newCourse: Course = { ...course, id: newId, qr_code_url: finalQrUrl };
    
    if (supabase) {
      const { data, error } = await supabase.from('courses').insert(newCourse).select().single();
      if (!error && data) return data as Course;
      console.error('Supabase addCourse error:', error);
    }

    const courses = getLocalStorage<Course[]>('univision_courses', INITIAL_COURSES);
    courses.push(newCourse);
    setLocalStorage('univision_courses', courses);
    return newCourse;
  },

  async deleteCourse(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (!error) return true;
      console.error('Supabase deleteCourse error:', error);
    }
    const courses = getLocalStorage<Course[]>('univision_courses', INITIAL_COURSES);
    const updated = courses.filter(c => c.id !== id);
    setLocalStorage('univision_courses', updated);
    return true;
  },

  // --- Batches ---
  async getBatches(courseId?: string): Promise<Batch[]> {
    if (supabase) {
      let query = supabase.from('batches').select('*');
      if (courseId) query = query.eq('course_id', courseId);
      const { data, error } = await supabase.from('batches').select('*');
      if (!error && data) {
        const result = data as Batch[];
        return courseId ? result.filter(b => b.course_id === courseId) : result;
      }
      console.error('Supabase getBatches error:', error);
    }
    const batches = getLocalStorage<Batch[]>('univision_batches', INITIAL_BATCHES);
    return courseId ? batches.filter(b => b.course_id === courseId) : batches;
  },

  async addBatch(batch: Omit<Batch, 'id'>): Promise<Batch> {
    const newId = crypto.randomUUID();
    
    // Clean mentor_id: convert empty string to null to prevent invalid UUID database errors
    const cleanedMentorId = batch.mentor_id && batch.mentor_id.trim() !== '' 
      ? batch.mentor_id 
      : null;

    const newBatch: Batch = { 
      ...batch, 
      id: newId, 
      mentor_id: cleanedMentorId 
    };

    if (supabase) {
      const { data, error } = await supabase.from('batches').insert(newBatch).select().single();
      if (!error && data) return data as Batch;
      console.error('Supabase addBatch error:', error);
    }

    const batches = getLocalStorage<Batch[]>('univision_batches', INITIAL_BATCHES);
    batches.push(newBatch);
    setLocalStorage('univision_batches', batches);
    return newBatch;
  },

  async updateBatchMeetLink(batchId: string, meetLink: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('batches')
        .update({ google_meet_link: meetLink })
        .eq('id', batchId);
      if (!error) return true;
      console.error('Supabase updateBatchMeetLink error:', error);
    }

    // Local Storage:
    const batches = getLocalStorage<Batch[]>('univision_batches', INITIAL_BATCHES);
    const batch = batches.find(b => b.id === batchId);
    if (batch) {
      batch.google_meet_link = meetLink;
      setLocalStorage('univision_batches', batches);
      return true;
    }
    return false;
  },

  // --- Profiles & Authentication ---
  async getProfiles(): Promise<Profile[]> {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) return data as Profile[];
      console.error('Supabase getProfiles error:', error);
    }
    const students = getLocalStorage<Profile[]>('univision_students_profiles', []);
    const mentors = getLocalStorage<Profile[]>('univision_mentors_profiles', INITIAL_MENTORS);
    const admins = getLocalStorage<Profile[]>('univision_admins_profiles', INITIAL_ADMINS);
    const cores = getLocalStorage<Profile[]>('univision_cores_profiles', []);
    return [...students, ...mentors, ...admins, ...cores];
  },

  async getProfile(id: string): Promise<Profile | null> {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (!error && data) return data as Profile;
      console.error('Supabase getProfile error:', error);
    }
    const profiles = await this.getProfiles();
    return profiles.find(p => p.id === id) || null;
  },

  async getProfileByReferralCode(code: string): Promise<Profile | null> {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*').eq('referral_code', code).single();
      if (!error && data) return data as Profile;
      console.error('Supabase getProfileByReferralCode error:', error);
    }
    const profiles = await this.getProfiles();
    return profiles.find(p => p.referral_code?.toUpperCase() === code.toUpperCase()) || null;
  },

  async addMentor(mentor: Omit<Profile, 'id' | 'role' | 'referral_code'>): Promise<Profile> {
    const newId = crypto.randomUUID();
    const newMentor: Profile = {
      ...mentor,
      id: newId,
      role: 'mentor'
    };

    if (supabase) {
      // In live Supabase, creating a mentor manually requires auth.signUp or admin functions.
      // For ease in this prototype, we'll write directly to profiles.
      const { data, error } = await supabase.from('profiles').insert(newMentor).select().single();
      if (!error && data) return data as Profile;
      console.error('Supabase addMentor error:', error);
    }

    const mentors = getLocalStorage<Profile[]>('univision_mentors_profiles', INITIAL_MENTORS);
    mentors.push(newMentor);
    setLocalStorage('univision_mentors_profiles', mentors);
    return newMentor;
  },

  // --- Wallets ---
  async getWallet(studentId: string): Promise<Wallet | null> {
    if (supabase) {
      const { data, error } = await supabase.from('wallets').select('*').eq('student_id', studentId).single();
      if (!error && data) return data as Wallet;
      
      if (error && error.code === 'PGRST116') {
        // Automatically provision wallet row in Supabase
        const newWallet = {
          id: crypto.randomUUID(),
          student_id: studentId,
          balance: 0.00
        };
        const { data: createdWallet, error: createError } = await supabase
          .from('wallets')
          .insert(newWallet)
          .select()
          .single();
        if (!createError && createdWallet) return createdWallet as Wallet;
      } else {
        console.error('Supabase getWallet error:', error);
      }
    }
    const wallets = getLocalStorage<Wallet[]>('univision_wallets', []);
    let wallet = wallets.find(w => w.student_id === studentId);
    if (!wallet) {
      wallet = {
        id: crypto.randomUUID(),
        student_id: studentId,
        balance: 0.00
      };
      wallets.push(wallet);
      setLocalStorage('univision_wallets', wallets);
    }
    return wallet;
  },

  async getWallets(): Promise<Wallet[]> {
    if (supabase) {
      const { data, error } = await supabase.from('wallets').select('*');
      if (!error && data) return data as Wallet[];
      console.error('Supabase getWallets error:', error);
    }
    return getLocalStorage<Wallet[]>('univision_wallets', []);
  },

  // --- Enrollments ---
  async getEnrollments(studentId?: string): Promise<Enrollment[]> {
    let dbEnrollments: Enrollment[] = [];
    if (supabase) {
      try {
        let query = supabase.from('enrollments').select('*');
        if (studentId) query = query.eq('student_id', studentId);
        const { data, error } = await query;
        if (!error && data) dbEnrollments = data as Enrollment[];
      } catch (e) {
        console.error('Supabase getEnrollments error:', e);
      }
    }

    const localEnrollments = getLocalStorage<Enrollment[]>('univision_enrollments', []);
    const filteredLocal = studentId ? localEnrollments.filter(e => e.student_id === studentId) : localEnrollments;

    // Merge Supabase and Local storage enrollments seamlessly by ID
    const map = new Map<string, Enrollment>();
    filteredLocal.forEach(e => map.set(e.id, e));
    dbEnrollments.forEach(e => map.set(e.id, e));

    return Array.from(map.values());
  },

  async enrollStudent(
    studentId: string,
    batchId: string,
    courseId: string,
    amountPaid: number,
    transactionId: string,
    referredByCode?: string
  ): Promise<Enrollment> {
    let referredById: string | null = null;
    
    if (referredByCode && referredByCode.trim()) {
      const referrer = await this.getProfileByReferralCode(referredByCode.trim());
      if (referrer) {
        if (referrer.id === studentId) {
          throw new Error('Self referral is prohibited.');
        }
        
        // Strategy C: Directed Graph Cycle Detection
        const hasCycle = await this.detectReferralCycle(studentId, referrer.id);
        if (hasCycle) {
          throw new Error('Invalid referral: cycle detected (closed loops are prohibited).');
        }

        referredById = referrer.id;
      }
    } else {
      // Fallback to profile's referred_by_id if not overridden
      const studentProfile = await this.getProfile(studentId);
      if (studentProfile && studentProfile.referred_by_id) {
        referredById = studentProfile.referred_by_id;
      }
    }

    const newEnrollment: Enrollment = {
      id: crypto.randomUUID(),
      student_id: studentId,
      batch_id: batchId,
      course_id: courseId,
      payment_status: 'pending', // Starts as pending until manual admin approval
      payment_method: 'QR Code',
      amount_paid: amountPaid,
      transaction_id: transactionId,
      referred_by_id: referredById,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('enrollments').insert(newEnrollment);
        if (error) console.error('Supabase enrollStudent error:', error);
      } catch (e) {
        console.error('Supabase enrollStudent exception:', e);
      }
    }

    // Always update local storage as well for hybrid persistence
    const enrollments = getLocalStorage<Enrollment[]>('univision_enrollments', []);
    const idx = enrollments.findIndex(e => e.id === newEnrollment.id);
    if (idx === -1) {
      enrollments.push(newEnrollment);
    } else {
      enrollments[idx] = newEnrollment;
    }
    setLocalStorage('univision_enrollments', enrollments);

    return newEnrollment;
  },

  async approveEnrollment(enrollmentId: string): Promise<boolean> {
    // 1. Fetch enrollment target
    const allEnrollments = await this.getEnrollments();
    const targetEnrollment = allEnrollments.find(e => e.id === enrollmentId);
    if (!targetEnrollment) return false;

    // 2. Mark payment_status as completed in Supabase
    if (supabase) {
      try {
        await supabase
          .from('enrollments')
          .update({ payment_status: 'completed' })
          .eq('id', enrollmentId);
      } catch (e) {
        console.error('Supabase approveEnrollment update error:', e);
      }
    }

    // 3. Mark payment_status as completed in Local storage
    const localEnrollments = getLocalStorage<Enrollment[]>('univision_enrollments', []);
    const lIdx = localEnrollments.findIndex(e => e.id === enrollmentId);
    if (lIdx !== -1) {
      localEnrollments[lIdx].payment_status = 'completed';
    } else {
      localEnrollments.push({ ...targetEnrollment, payment_status: 'completed' });
    }
    setLocalStorage('univision_enrollments', localEnrollments);

    // 4. Calculate and credit referral reward (12.5% subject to 50% max cap) if referred
    const referredById = targetEnrollment.referred_by_id;
    const amountPaid = targetEnrollment.amount_paid;

    if (referredById) {
      const profilesList = await this.getProfiles();
      const referrer = profilesList.find(p => p.id === referredById);
      const isCore = referrer?.role === 'core';

      const baseReward = parseFloat((amountPaid * 0.125).toFixed(2));
      let actualReward = baseReward;

      if (!isCore) {
        // Enforce 50% cap of referrer's own paid course fees for students
        const updatedEnrollments = await this.getEnrollments();
        const studentCompleted = updatedEnrollments.filter(e => e.student_id === referredById && e.payment_status === 'completed');
        const totalPaidByReferrer = studentCompleted.reduce((sum, e) => sum + e.amount_paid, 0);
        const maxCap = totalPaidByReferrer * 0.50;

        const redemptions = await this.getRedemptions(referredById);
        const approvedRedeemed = redemptions.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0);

        const currentWallet = await this.getWallet(referredById);
        const currentBal = currentWallet ? currentWallet.balance : 0;
        const totalEarned = currentBal + approvedRedeemed;
        const remainingCap = Math.max(0, maxCap - totalEarned);

        actualReward = Math.min(baseReward, remainingCap);
        actualReward = parseFloat(actualReward.toFixed(2));
      }

      if (actualReward > 0) {
        // Update wallet in Supabase
        if (supabase) {
          try {
            const { data: wData } = await supabase.from('wallets').select('*').eq('student_id', referredById).single();
            if (wData) {
              const newBal = parseFloat((wData.balance + actualReward).toFixed(2));
              await supabase.from('wallets').update({ balance: newBal }).eq('student_id', referredById);
            } else {
              await supabase.from('wallets').insert({ id: crypto.randomUUID(), student_id: referredById, balance: actualReward });
            }
          } catch (e) {
            console.error('Supabase wallet update error:', e);
          }
        }

        // Update wallet in Local storage
        const wallets = getLocalStorage<Wallet[]>('univision_wallets', []);
        let referrerWallet = wallets.find(w => w.student_id === referredById);
        if (!referrerWallet) {
          referrerWallet = { id: crypto.randomUUID(), student_id: referredById, balance: 0.00 };
          wallets.push(referrerWallet);
        }
        referrerWallet.balance = parseFloat((referrerWallet.balance + actualReward).toFixed(2));
        setLocalStorage('univision_wallets', wallets);
      }
    }

    return true;
  },

  async getStudentRedemptionCap(studentId: string): Promise<{ totalPaid: number; maxCap: number; totalEarned: number; remainingCap: number }> {
    const enrollments = await this.getEnrollments(studentId);
    const completed = enrollments.filter(e => e.payment_status === 'completed');
    const totalPaid = completed.reduce((sum, e) => sum + e.amount_paid, 0);
    const maxCap = parseFloat((totalPaid * 0.50).toFixed(2));

    const wallet = await this.getWallet(studentId);
    const balance = wallet ? wallet.balance : 0;

    const redemptions = await this.getRedemptions(studentId);
    const approvedRedeemed = redemptions.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0);

    const totalEarned = parseFloat((balance + approvedRedeemed).toFixed(2));
    const remainingCap = Math.max(0, parseFloat((maxCap - totalEarned).toFixed(2)));

    return { totalPaid, maxCap, totalEarned, remainingCap };
  },

  async rejectEnrollment(enrollmentId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('enrollments')
        .update({ payment_status: 'failed' })
        .eq('id', enrollmentId);
      if (!error) return true;
      console.error('Supabase rejectEnrollment error:', error);
    }

    // Local mode manual rejection:
    const enrollments = getLocalStorage<Enrollment[]>('univision_enrollments', []);
    const idx = enrollments.findIndex(e => e.id === enrollmentId);
    if (idx !== -1) {
      enrollments[idx].payment_status = 'failed';
      setLocalStorage('univision_enrollments', enrollments);
      return true;
    }
    return false;
  },

  async updateCourseQrCode(courseId: string, qrCodeUrl: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('courses')
        .update({ qr_code_url: qrCodeUrl })
        .eq('id', courseId);
      if (!error) return true;
      console.error('Supabase updateCourseQrCode error:', error);
    }

    const courses = getLocalStorage<Course[]>('univision_courses', INITIAL_COURSES);
    const course = courses.find(c => c.id === courseId);
    if (course) {
      course.qr_code_url = qrCodeUrl;
      setLocalStorage('univision_courses', courses);
      return true;
    }
    return false;
  },

  async removeEnrollment(enrollmentId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId);
      if (!error) return true;
      console.error('Supabase removeEnrollment error:', error);
    }

    // Local mode removal:
    const enrollments = getLocalStorage<Enrollment[]>('univision_enrollments', []);
    const updated = enrollments.filter(e => e.id !== enrollmentId);
    setLocalStorage('univision_enrollments', updated);
    return true;
  },

  // --- Redemptions ---
  async getRedemptions(studentId?: string): Promise<(Redemption & { studentName?: string; studentEmail?: string })[]> {
    if (supabase) {
      let query = supabase.from('redemptions').select('*, profiles(name, email)');
      if (studentId) query = query.eq('student_id', studentId);
      const { data, error } = await query;
      if (!error && data) {
        return data.map((r: any) => ({
          id: r.id,
          student_id: r.student_id,
          amount: r.amount,
          status: r.status,
          payment_phone: r.payment_phone,
          created_at: r.created_at,
          processed_at: r.processed_at,
          studentName: r.profiles?.name,
          studentEmail: r.profiles?.email
        }));
      }
      console.error('Supabase getRedemptions error:', error);
    }

    // Local mode:
    const redemptions = getLocalStorage<Redemption[]>('univision_redemptions', []);
    const filtered = studentId ? redemptions.filter(r => r.student_id === studentId) : redemptions;
    const profiles = await this.getProfiles();

    return filtered.map(r => {
      const p = profiles.find(prof => prof.id === r.student_id);
      return {
        ...r,
        studentName: p?.name || 'Unknown Student',
        studentEmail: p?.email || '',
        payment_phone: r.payment_phone
      };
    });
  },

  async createRedemptionRequest(studentId: string, amount: number, paymentPhone: string): Promise<Redemption> {
    const newRedemption: Redemption = {
      id: crypto.randomUUID(),
      student_id: studentId,
      amount: amount,
      status: 'pending',
      payment_phone: paymentPhone,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase.from('redemptions').insert(newRedemption).select().single();
      if (!error && data) return data as Redemption;
      console.error('Supabase createRedemptionRequest error:', error);
    }

    const redemptions = getLocalStorage<Redemption[]>('univision_redemptions', []);
    redemptions.push(newRedemption);
    setLocalStorage('univision_redemptions', redemptions);
    return newRedemption;
  },

  async approveRedemption(redemptionId: string): Promise<boolean> {
    if (supabase) {
      const { data: redemption, error: fetchErr } = await supabase
        .from('redemptions')
        .select('*')
        .eq('id', redemptionId)
        .single();

      if (!fetchErr && redemption && redemption.status === 'pending') {
        const { error } = await supabase
          .from('redemptions')
          .update({ status: 'approved', processed_at: new Date().toISOString() })
          .eq('id', redemptionId);

        if (!error) {
          const { data: wallet } = await supabase
            .from('wallets')
            .select('*')
            .eq('student_id', redemption.student_id)
            .single();

          if (wallet) {
            const newBal = Math.max(0, parseFloat((wallet.balance - redemption.amount).toFixed(2)));
            await supabase
              .from('wallets')
              .update({ balance: newBal })
              .eq('student_id', redemption.student_id);
          }
          return true;
        }
        console.error('Supabase approveRedemption update error:', error);
      } else {
        console.error('Supabase approveRedemption fetch error:', fetchErr);
      }
    }

    // Local mode:
    const redemptions = getLocalStorage<Redemption[]>('univision_redemptions', []);
    const redemption = redemptions.find(r => r.id === redemptionId);
    if (redemption && redemption.status === 'pending') {
      redemption.status = 'approved';
      redemption.processed_at = new Date().toISOString();
      setLocalStorage('univision_redemptions', redemptions);

      // Deduct wallet balance for this student
      const wallets = getLocalStorage<Wallet[]>('univision_wallets', []);
      const wallet = wallets.find(w => w.student_id === redemption.student_id);
      if (wallet) {
        const newBal = Math.max(0, parseFloat((wallet.balance - redemption.amount).toFixed(2)));
        wallet.balance = newBal;
        setLocalStorage('univision_wallets', wallets);
      }
      return true;
    }
    return false;
  },

  // --- Session Simulation for Frontend ---
  setCurrentUser(profile: Profile | null) {
    if (typeof window !== 'undefined') {
      if (profile) {
        localStorage.setItem('univision_current_user', JSON.stringify(profile));
      } else {
        localStorage.removeItem('univision_current_user');
      }
      window.dispatchEvent(new Event('univision_auth_change'));
    }
  },

  getCurrentUser(): Profile | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('univision_current_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as Profile;
    } catch {
      return null;
    }
  },

  async signIn(email: string, password?: string): Promise<Profile> {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'password123'
      });
      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed.');
      
      // Query profile by user ID or email
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', data.user.email || email)
          .maybeSingle();
        profile = profileByEmail;
      }

      // Auto-heal missing profile row in public.profiles table
      if (!profile) {
        const isTargetAdmin = (data.user.email || email).toLowerCase().includes('admin') || (data.user.email || email).toLowerCase().includes('univisioncounsel');
        const roleVal: 'student' | 'mentor' | 'admin' | 'core' = data.user.user_metadata?.role || (isTargetAdmin ? 'admin' : 'student');
        
        const newProfile: Profile = {
          id: data.user.id,
          name: data.user.user_metadata?.name || (isTargetAdmin ? 'Mohamed Jaris (CEO & Founder)' : (data.user.email?.split('@')[0] || 'User Profile')),
          email: data.user.email || email,
          role: roleVal,
          status: 'approved',
          created_at: new Date().toISOString()
        };

        const { data: insertedProfile } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();

        profile = insertedProfile || newProfile;
      }

      const userProfile = profile as Profile;
      if (userProfile.role === 'core' && userProfile.status === 'pending') {
        throw new Error('Your Core Member account is pending admin approval.');
      }
      if (userProfile.role === 'core' && userProfile.status === 'rejected') {
        throw new Error('Your Core Member application has been rejected.');
      }
      return userProfile;
    }
    
    // Local Storage Mode:
    const profiles = await this.getProfiles();
    const user = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('User profile not found. Please register first.');
    
    const targetPassword = password || 'password123';
    if (user.password && user.password !== targetPassword) {
      throw new Error('Invalid password. Please try again.');
    }
    
    if (user.role === 'core' && user.status === 'pending') {
      throw new Error('Your Core Member account is pending admin approval.');
    }
    if (user.role === 'core' && user.status === 'rejected') {
      throw new Error('Your Core Member application has been rejected.');
    }
    
    return user;
  },

  async resetPassword(email: string): Promise<boolean> {
    if (supabase) {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth?type=recovery`
        : 'http://localhost:3000/auth?type=recovery';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      if (!error) return true;
      console.error('Supabase resetPassword error:', error);
      throw error;
    }

    // Local Storage Fallback: resets local profile password to 'password123'
    const profiles = await this.getProfiles();
    const user = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.password = 'password123';
      
      if (user.role === 'student') {
        const students = getLocalStorage<Profile[]>('univision_students_profiles', []);
        const idx = students.findIndex(s => s.id === user.id);
        if (idx !== -1) {
          students[idx].password = 'password123';
          setLocalStorage('univision_students_profiles', students);
        }
      } else if (user.role === 'mentor') {
        const mentors = getLocalStorage<Profile[]>('univision_mentors_profiles', INITIAL_MENTORS);
        const idx = mentors.findIndex(m => m.id === user.id);
        if (idx !== -1) {
          mentors[idx].password = 'password123';
          setLocalStorage('univision_mentors_profiles', mentors);
        }
      } else {
        const admins = getLocalStorage<Profile[]>('univision_admins_profiles', INITIAL_ADMINS);
        const idx = admins.findIndex(a => a.id === user.id);
        if (idx !== -1) {
          admins[idx].password = 'password123';
          setLocalStorage('univision_admins_profiles', admins);
        }
      }
      return true;
    }
    return false;
  },

  async updateUserPassword(newPassword: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('Supabase updateUser password error:', error);
        throw error;
      }
      return true;
    }

    const currentUser = this.getCurrentUser();
    if (currentUser) {
      currentUser.password = newPassword;
      this.setCurrentUser(currentUser);
    }
    return true;
  },

  async registerUser(
    email: string,
    name: string,
    role: 'student' | 'mentor' | 'admin' | 'core',
    dob?: string,
    contactNumber?: string,
    specialization?: string,
    referredByCode?: string,
    password?: string
  ): Promise<Profile> {
    if (supabase) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: password || 'password123',
        options: {
          data: {
            name,
            dob,
            contact_number: contactNumber,
            referred_by_code: referredByCode,
            role,
            specialization
          }
        }
      });
      if (authError) {
        console.error('Supabase auth.signUp error:', authError);
        throw authError;
      }
      if (authData.user) {
        // Construct return profile
        const supabaseProfile: Profile = {
          id: authData.user.id,
          name,
          email,
          role,
          dob,
          contact_number: contactNumber,
          specialization,
          status: role === 'core' ? 'pending' : 'approved',
          referral_code: (role === 'student' || role === 'core') ? `REF-${authData.user.id.replace(/-/g, '').substring(0, 8).toUpperCase()}` : undefined,
          created_at: new Date().toISOString()
        };
        return supabaseProfile;
      }
    }

    // Local Storage Mode Fallback:
    const existingProfiles = await this.getProfiles();
    if (existingProfiles.some(p => p.email.toLowerCase() === email.trim().toLowerCase())) {
      throw new Error('User already registered with this email.');
    }

    const userId = crypto.randomUUID();
    let referredById: string | null = null;

    if (role === 'student' && referredByCode) {
      const referrer = await this.getProfileByReferralCode(referredByCode);
      if (referrer) {
        if (referrer.email.toLowerCase() === email.toLowerCase()) {
          throw new Error('Self referral is prohibited.');
        }
        referredById = referrer.id;
      }
    }

    const referralCode = (role === 'student' || role === 'core') ? `REF-${userId.replace(/-/g, '').substring(0, 8).toUpperCase()}` : undefined;

    const newProfile: Profile = {
      id: userId,
      name,
      email,
      role,
      dob,
      contact_number: contactNumber,
      specialization,
      referral_code: referralCode,
      referred_by_id: referredById,
      created_at: new Date().toISOString(),
      status: role === 'core' ? 'pending' : 'approved',
      password: password || 'password123'
    };

    // Save to role-specific storage
    if (role === 'student') {
      const students = getLocalStorage<Profile[]>('univision_students_profiles', []);
      students.push(newProfile);
      setLocalStorage('univision_students_profiles', students);

      // Create wallet
      const wallets = getLocalStorage<Wallet[]>('univision_wallets', []);
      wallets.push({
        id: crypto.randomUUID(),
        student_id: userId,
        balance: 0.00
      });
      setLocalStorage('univision_wallets', wallets);
    } else if (role === 'core') {
      const cores = getLocalStorage<Profile[]>('univision_cores_profiles', []);
      cores.push(newProfile);
      setLocalStorage('univision_cores_profiles', cores);

      // Create wallet for core member
      const wallets = getLocalStorage<Wallet[]>('univision_wallets', []);
      wallets.push({
        id: crypto.randomUUID(),
        student_id: userId,
        balance: 0.00
      });
      setLocalStorage('univision_wallets', wallets);
    } else if (role === 'mentor') {
      const mentors = getLocalStorage<Profile[]>('univision_mentors_profiles', INITIAL_MENTORS);
      mentors.push(newProfile);
      setLocalStorage('univision_mentors_profiles', mentors);
    } else {
      const admins = getLocalStorage<Profile[]>('univision_admins_profiles', INITIAL_ADMINS);
      admins.push(newProfile);
      setLocalStorage('univision_admins_profiles', admins);
    }

    return newProfile;
  },

  async promoteUser(userId: string, role: 'mentor' | 'admin' | 'core', specialization?: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ role, specialization })
        .eq('id', userId);
      if (!error) return true;
      console.error('Supabase promoteUser error:', error);
    }

    // Local Storage:
    const students = getLocalStorage<Profile[]>('univision_students_profiles', []);
    const mentors = getLocalStorage<Profile[]>('univision_mentors_profiles', INITIAL_MENTORS);
    const admins = getLocalStorage<Profile[]>('univision_admins_profiles', INITIAL_ADMINS);
    const cores = getLocalStorage<Profile[]>('univision_cores_profiles', []);

    const studentIdx = students.findIndex(s => s.id === userId);
    if (studentIdx !== -1) {
      const student = students[studentIdx];
      students.splice(studentIdx, 1);
      setLocalStorage('univision_students_profiles', students);

      const updatedProfile: Profile = {
        ...student,
        role,
        specialization: specialization || (role === 'mentor' ? 'Full-Stack Web Development' : 'Marketing Team')
      };

      if (role === 'mentor') {
        mentors.push(updatedProfile);
        setLocalStorage('univision_mentors_profiles', mentors);
      } else if (role === 'core') {
        cores.push(updatedProfile);
        setLocalStorage('univision_cores_profiles', cores);
      } else {
        admins.push(updatedProfile);
        setLocalStorage('univision_admins_profiles', admins);
      }
      return true;
    }

    const mentorIdx = mentors.findIndex(m => m.id === userId);
    if (mentorIdx !== -1) {
      const mentor = mentors[mentorIdx];
      mentors.splice(mentorIdx, 1);
      setLocalStorage('univision_mentors_profiles', mentors);

      const updatedProfile: Profile = {
        ...mentor,
        role,
        specialization: specialization || mentor.specialization
      };

      if (role === 'admin') {
        admins.push(updatedProfile);
        setLocalStorage('univision_admins_profiles', admins);
      } else if (role === 'core') {
        cores.push(updatedProfile);
        setLocalStorage('univision_cores_profiles', cores);
      } else {
        mentors.push(updatedProfile);
        setLocalStorage('univision_mentors_profiles', mentors);
      }
      return true;
    }

    const coreIdx = cores.findIndex(c => c.id === userId);
    if (coreIdx !== -1) {
      const core = cores[coreIdx];
      cores.splice(coreIdx, 1);
      setLocalStorage('univision_cores_profiles', cores);

      const updatedProfile: Profile = {
        ...core,
        role,
        specialization: specialization || core.specialization
      };

      if (role === 'mentor') {
        mentors.push(updatedProfile);
        setLocalStorage('univision_mentors_profiles', mentors);
      } else if (role === 'admin') {
        admins.push(updatedProfile);
        setLocalStorage('univision_admins_profiles', admins);
      } else {
        cores.push(updatedProfile);
        setLocalStorage('univision_cores_profiles', cores);
      }
      return true;
    }

    return false;
  },

  async getTeamMeetings(): Promise<{ team_name: string; google_meet_link: string | null }[]> {
    if (supabase) {
      const { data, error } = await supabase.from('team_meetings').select('*');
      if (!error && data) return data;
      console.error('Supabase getTeamMeetings error:', error);
    }
    const defaultMeetings = [
      { team_name: 'PR Team', google_meet_link: null },
      { team_name: 'Marketing Team', google_meet_link: null },
      { team_name: 'Course Validation Team', google_meet_link: null }
    ];
    return getLocalStorage('univision_team_meetings', defaultMeetings);
  },

  async updateTeamMeetLink(teamName: string, meetLink: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('team_meetings')
        .update({ google_meet_link: meetLink, updated_at: new Date().toISOString() })
        .eq('team_name', teamName);
      if (!error) return true;
      console.error('Supabase updateTeamMeetLink error:', error);
    }

    const meetings = await this.getTeamMeetings();
    const meeting = meetings.find(m => m.team_name === teamName);
    if (meeting) {
      meeting.google_meet_link = meetLink;
      setLocalStorage('univision_team_meetings', meetings);
      return true;
    }
    return false;
  },

  async approveCoreMember(userId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', userId);
      if (!error) return true;
      console.error('Supabase approveCoreMember error:', error);
    }

    const cores = getLocalStorage<Profile[]>('univision_cores_profiles', []);
    const idx = cores.findIndex(c => c.id === userId);
    if (idx !== -1) {
      cores[idx].status = 'approved';
      setLocalStorage('univision_cores_profiles', cores);
      return true;
    }
    const students = getLocalStorage<Profile[]>('univision_students_profiles', []);
    const sIdx = students.findIndex(s => s.id === userId);
    if (sIdx !== -1) {
      students[sIdx].status = 'approved';
      setLocalStorage('univision_students_profiles', students);
      return true;
    }
    const mentors = getLocalStorage<Profile[]>('univision_mentors_profiles', INITIAL_MENTORS);
    const mIdx = mentors.findIndex(m => m.id === userId);
    if (mIdx !== -1) {
      mentors[mIdx].status = 'approved';
      setLocalStorage('univision_mentors_profiles', mentors);
      return true;
    }
    return false;
  },

  async rejectCoreMember(userId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', userId);
      if (!error) return true;
      console.error('Supabase rejectCoreMember error:', error);
    }

    const cores = getLocalStorage<Profile[]>('univision_cores_profiles', []);
    const idx = cores.findIndex(c => c.id === userId);
    if (idx !== -1) {
      cores[idx].status = 'rejected';
      setLocalStorage('univision_cores_profiles', cores);
      return true;
    }
    return false;
  },

  async detectReferralCycle(studentId: string, referrerId: string): Promise<boolean> {
    let currentReferrerId: string | null = referrerId;
    const visited = new Set<string>();
    visited.add(studentId);

    while (currentReferrerId) {
      if (visited.has(currentReferrerId)) {
        return true;
      }
      visited.add(currentReferrerId);
      const profile = await this.getProfile(currentReferrerId);
      currentReferrerId = (profile && profile.referred_by_id) ? profile.referred_by_id : null;
    }
    return false;
  }
};
