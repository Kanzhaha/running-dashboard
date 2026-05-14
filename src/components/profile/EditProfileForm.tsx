import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { RunningMode } from '../../types';

type EditProfileFormProps = {
  initialProfile: {
    full_name: string;
    weight_kg: number;
    height_cm: number;
    sex: 'male' | 'female';
    preferred_mode?: RunningMode;
  };
  onSave: (data: {
    full_name: string;
    weight_kg: number;
    height_cm: number;
    sex: 'male' | 'female';
    preferred_mode?: RunningMode;
  }) => Promise<void>;
};

export const EditProfileForm: React.FC<EditProfileFormProps> = ({
  initialProfile,
  onSave,
}) => {
  const [form, setForm] = useState({
    full_name: initialProfile.full_name || '',
    weight_kg: String(initialProfile.weight_kg || ''),
    height_cm: String(initialProfile.height_cm || ''),
    sex: initialProfile.sex || 'male',
    preferred_mode: initialProfile.preferred_mode || 'outdoor',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({
      full_name: initialProfile.full_name || '',
      weight_kg: String(initialProfile.weight_kg || ''),
      height_cm: String(initialProfile.height_cm || ''),
      sex: initialProfile.sex || 'male',
      preferred_mode: initialProfile.preferred_mode || 'outdoor',
    });
  }, [initialProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const weight = Number(form.weight_kg);
    const height = Number(form.height_cm);

    if (!form.full_name.trim()) {
      alert('Name is required.');
      return;
    }

    if (!Number.isFinite(weight) || weight < 20 || weight > 200) {
      alert('Weight must be between 20 and 200 kg.');
      return;
    }

    if (!Number.isFinite(height) || height < 100 || height > 250) {
      alert('Height must be between 100 and 250 cm.');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        full_name: form.full_name.trim(),
        weight_kg: weight,
        height_cm: height,
        sex: form.sex as 'male' | 'female',
        preferred_mode: form.preferred_mode as RunningMode,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-slate-400 mb-2">Full Name</label>
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Weight (kg)</label>
        <input
          type="number"
          value={form.weight_kg}
          onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Height (cm)</label>
        <input
          type="number"
          value={form.height_cm}
          onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Gender</label>
        <select
          value={form.sex}
          onChange={(e) => setForm({ ...form, sex: e.target.value as 'male' | 'female' })}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Preferred Mode</label>
        <select
          value={form.preferred_mode}
          onChange={(e) => setForm({ ...form, preferred_mode: e.target.value as RunningMode })}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
        >
          <option value="outdoor">Outdoor</option>
          <option value="indoor">Indoor</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 py-3 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save size={16} />
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
};