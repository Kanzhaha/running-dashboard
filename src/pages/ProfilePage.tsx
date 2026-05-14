import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/profileServices';
import { EditProfileForm } from '../components/profile/EditProfileForm';
import { signOut } from '../services/authServices';

type ProfileState = {
  full_name: string;
  weight_kg: number;
  height_cm: number;
  sex: 'male' | 'female';
  preferred_mode?: 'indoor' | 'outdoor';
};

const DEFAULT_PROFILE: ProfileState = {
  full_name: '',
  weight_kg: 0,
  height_cm: 0,
  sex: 'male',
  preferred_mode: 'outdoor',
};

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setPageLoading(false);
        return;
      }

      const { data, error } = await getProfile(user.id);

      if (error) {
        console.error('Error fetching profile:', error.message);
        setProfile(DEFAULT_PROFILE);
        setPageLoading(false);
        return;
      }

      if (data) {
        setProfile({
          full_name: data.full_name ?? '',
          weight_kg: data.weight_kg ?? 0,
          height_cm: data.height_cm ?? 0,
          sex: data.sex ?? 'male',
          preferred_mode: data.preferred_mode ?? 'outdoor',
        });
      } else {
        setProfile(DEFAULT_PROFILE);
      }

      setPageLoading(false);
    };

    if (!loading) {
      loadProfile();
    }
  }, [user, loading]);

  const handleSave = async (updatedData: ProfileState) => {
    if (!user) return;

    const { error } = await updateProfile(user.id, updatedData);

    if (error) {
      alert(error.message);
      return;
    }

    setProfile(updatedData);

    localStorage.setItem(
      'userProfile',
      JSON.stringify({
        name: updatedData.full_name,
        weight: String(updatedData.weight_kg),
        height: String(updatedData.height_cm),
        gender: updatedData.sex,
        mode: updatedData.preferred_mode || 'outdoor',
      })
    );

    alert('Profile updated successfully.');
  };

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem('userProfile');
    localStorage.removeItem('pendingProfile');
    navigate('/');
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-[#0B0C15] text-white flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0C15] text-white flex items-center justify-center">
        Profile not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C15] py-8 px-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <User className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>

          <EditProfileForm initialProfile={profile ?? DEFAULT_PROFILE} onSave={handleSave} />

          <button
            onClick={handleLogout}
            className="w-full mt-6 rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-red-300 hover:bg-red-500/20 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};