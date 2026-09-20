// Dihasilkan dari skema database. Jangan disunting tangan —
// jalankan ulang generator setiap kali ada migrasi baru.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          aksi: string
          aktor_id: string | null
          data_baru: Json | null
          data_lama: Json | null
          id: number
          nama_tabel: string
          record_id: string | null
          waktu: string
        }
        Insert: {
          aksi: string
          aktor_id?: string | null
          data_baru?: Json | null
          data_lama?: Json | null
          id?: never
          nama_tabel: string
          record_id?: string | null
          waktu?: string
        }
        Update: {
          aksi?: string
          aktor_id?: string | null
          data_baru?: Json | null
          data_lama?: Json | null
          id?: never
          nama_tabel?: string
          record_id?: string | null
          waktu?: string
        }
        Relationships: []
      }
      batch_dojo: {
        Row: {
          created_at: string
          dikunci_oleh: string | null
          dikunci_pada: string | null
          dojo_id: string
          event_id: string
          id: string
          jumlah_peserta: number
          status: Database["public"]["Enums"]["status_batch"]
          tingkat_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dikunci_oleh?: string | null
          dikunci_pada?: string | null
          dojo_id: string
          event_id: string
          id?: string
          jumlah_peserta?: number
          status?: Database["public"]["Enums"]["status_batch"]
          tingkat_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dikunci_oleh?: string | null
          dikunci_pada?: string | null
          dojo_id?: string
          event_id?: string
          id?: string
          jumlah_peserta?: number
          status?: Database["public"]["Enums"]["status_batch"]
          tingkat_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_dojo_dojo_id_fkey"
            columns: ["dojo_id"]
            isOneToOne: false
            referencedRelation: "dojo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_dojo_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ujian"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_tingkat_sesuai_event"
            columns: ["tingkat_id", "event_id"]
            isOneToOne: false
            referencedRelation: "tingkat"
            referencedColumns: ["id", "event_id"]
          },
        ]
      }
      berkas_peserta: {
        Row: {
          alasan_tolak: string | null
          created_at: string
          diverifikasi_oleh: string | null
          diverifikasi_pada: string | null
          id: string
          jenis: Database["public"]["Enums"]["jenis_berkas"]
          path_storage: string
          peserta_id: string
          status: Database["public"]["Enums"]["status_berkas"]
          updated_at: string
        }
        Insert: {
          alasan_tolak?: string | null
          created_at?: string
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          id?: string
          jenis: Database["public"]["Enums"]["jenis_berkas"]
          path_storage: string
          peserta_id: string
          status?: Database["public"]["Enums"]["status_berkas"]
          updated_at?: string
        }
        Update: {
          alasan_tolak?: string | null
          created_at?: string
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_berkas"]
          path_storage?: string
          peserta_id?: string
          status?: Database["public"]["Enums"]["status_berkas"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "berkas_peserta_peserta_id_fkey"
            columns: ["peserta_id"]
            isOneToOne: false
            referencedRelation: "peserta"
            referencedColumns: ["id"]
          },
        ]
      }
      counter_nomor: {
        Row: {
          event_id: string
          terakhir: number
          tingkat_id: string
          updated_at: string
        }
        Insert: {
          event_id: string
          terakhir?: number
          tingkat_id: string
          updated_at?: string
        }
        Update: {
          event_id?: string
          terakhir?: number
          tingkat_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counter_nomor_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ujian"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counter_tingkat_sesuai_event"
            columns: ["tingkat_id", "event_id"]
            isOneToOne: false
            referencedRelation: "tingkat"
            referencedColumns: ["id", "event_id"]
          },
        ]
      }
      dojo: {
        Row: {
          created_at: string
          id: string
          kode: string
          kota: string | null
          nama: string
          nama_ketua: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kode: string
          kota?: string | null
          nama: string
          nama_ketua?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kode?: string
          kota?: string | null
          nama?: string
          nama_ketua?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_ujian: {
        Row: {
          created_at: string
          id: string
          lokasi: string | null
          nama: string
          status: Database["public"]["Enums"]["status_event"]
          tanggal: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lokasi?: string | null
          nama: string
          status?: Database["public"]["Enums"]["status_event"]
          tanggal: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lokasi?: string | null
          nama?: string
          status?: Database["public"]["Enums"]["status_event"]
          tanggal?: string
          updated_at?: string
        }
        Relationships: []
      }
      pembayaran: {
        Row: {
          alasan_tolak: string | null
          created_at: string
          diverifikasi_oleh: string | null
          diverifikasi_pada: string | null
          id: string
          jumlah: number
          path_bukti: string | null
          peserta_id: string
          status: Database["public"]["Enums"]["status_pembayaran"]
          updated_at: string
        }
        Insert: {
          alasan_tolak?: string | null
          created_at?: string
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          id?: string
          jumlah: number
          path_bukti?: string | null
          peserta_id: string
          status?: Database["public"]["Enums"]["status_pembayaran"]
          updated_at?: string
        }
        Update: {
          alasan_tolak?: string | null
          created_at?: string
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          id?: string
          jumlah?: number
          path_bukti?: string | null
          peserta_id?: string
          status?: Database["public"]["Enums"]["status_pembayaran"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pembayaran_peserta_id_fkey"
            columns: ["peserta_id"]
            isOneToOne: true
            referencedRelation: "peserta"
            referencedColumns: ["id"]
          },
        ]
      }
      penguji_tugas: {
        Row: {
          created_at: string
          event_id: string
          id: string
          no_akhir: number | null
          no_awal: number | null
          penguji_user_id: string
          tingkat_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          no_akhir?: number | null
          no_awal?: number | null
          penguji_user_id: string
          tingkat_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          no_akhir?: number | null
          no_awal?: number | null
          penguji_user_id?: string
          tingkat_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "penguji_tugas_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ujian"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tugas_tingkat_sesuai_event"
            columns: ["tingkat_id", "event_id"]
            isOneToOne: false
            referencedRelation: "tingkat"
            referencedColumns: ["id", "event_id"]
          },
        ]
      }
      penilaian: {
        Row: {
          catatan: string | null
          created_at: string
          dikunci: boolean
          dinilai_pada: string | null
          hadir: boolean
          id: string
          nilai: number
          penguji_user_id: string | null
          peserta_id: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          dikunci?: boolean
          dinilai_pada?: string | null
          hadir?: boolean
          id?: string
          nilai: number
          penguji_user_id?: string | null
          peserta_id: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          dikunci?: boolean
          dinilai_pada?: string | null
          hadir?: boolean
          id?: string
          nilai?: number
          penguji_user_id?: string | null
          peserta_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "penilaian_peserta_id_fkey"
            columns: ["peserta_id"]
            isOneToOne: true
            referencedRelation: "peserta"
            referencedColumns: ["id"]
          },
        ]
      }
      peserta: {
        Row: {
          catatan: string | null
          created_at: string
          didaftarkan_oleh: string | null
          dojo_id: string
          event_id: string
          id: string
          jenis_kelamin: Database["public"]["Enums"]["jenis_kelamin"] | null
          nama_lengkap: string
          no_dada: string | null
          no_urut: number | null
          sabuk_sekarang: string | null
          status: Database["public"]["Enums"]["status_peserta"]
          tgl_lahir: string | null
          tingkat_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          didaftarkan_oleh?: string | null
          dojo_id: string
          event_id: string
          id?: string
          jenis_kelamin?: Database["public"]["Enums"]["jenis_kelamin"] | null
          nama_lengkap: string
          no_dada?: string | null
          no_urut?: number | null
          sabuk_sekarang?: string | null
          status?: Database["public"]["Enums"]["status_peserta"]
          tgl_lahir?: string | null
          tingkat_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          catatan?: string | null
          created_at?: string
          didaftarkan_oleh?: string | null
          dojo_id?: string
          event_id?: string
          id?: string
          jenis_kelamin?: Database["public"]["Enums"]["jenis_kelamin"] | null
          nama_lengkap?: string
          no_dada?: string | null
          no_urut?: number | null
          sabuk_sekarang?: string | null
          status?: Database["public"]["Enums"]["status_peserta"]
          tgl_lahir?: string | null
          tingkat_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peserta_dojo_id_fkey"
            columns: ["dojo_id"]
            isOneToOne: false
            referencedRelation: "dojo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peserta_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ujian"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peserta_tingkat_sesuai_event"
            columns: ["tingkat_id", "event_id"]
            isOneToOne: false
            referencedRelation: "tingkat"
            referencedColumns: ["id", "event_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          dojo_id: string | null
          id: string
          nama: string
          no_hp: string | null
          peran: Database["public"]["Enums"]["peran"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          dojo_id?: string | null
          id: string
          nama: string
          no_hp?: string | null
          peran?: Database["public"]["Enums"]["peran"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          dojo_id?: string | null
          id?: string
          nama?: string
          no_hp?: string | null
          peran?: Database["public"]["Enums"]["peran"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_dojo_id_fkey"
            columns: ["dojo_id"]
            isOneToOne: false
            referencedRelation: "dojo"
            referencedColumns: ["id"]
          },
        ]
      }
      tingkat: {
        Row: {
          batas_lulus: number
          biaya: number
          created_at: string
          ditutup_oleh: string | null
          ditutup_pada: string | null
          event_id: string
          hasil_ditutup: boolean
          id: string
          kode: string
          nama: string
          nilai_bawaan: number
          sabuk_asal: string
          sabuk_tujuan: string
          updated_at: string
          urutan: number
          wajib_sertifikat_terakhir: boolean
        }
        Insert: {
          batas_lulus?: number
          biaya?: number
          created_at?: string
          ditutup_oleh?: string | null
          ditutup_pada?: string | null
          event_id: string
          hasil_ditutup?: boolean
          id?: string
          kode: string
          nama: string
          nilai_bawaan?: number
          sabuk_asal: string
          sabuk_tujuan: string
          updated_at?: string
          urutan?: number
          wajib_sertifikat_terakhir?: boolean
        }
        Update: {
          batas_lulus?: number
          biaya?: number
          created_at?: string
          ditutup_oleh?: string | null
          ditutup_pada?: string | null
          event_id?: string
          hasil_ditutup?: boolean
          id?: string
          kode?: string
          nama?: string
          nilai_bawaan?: number
          sabuk_asal?: string
          sabuk_tujuan?: string
          updated_at?: string
          urutan?: number
          wajib_sertifikat_terakhir?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tingkat_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ujian"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adalah_kontingen: { Args: never; Returns: boolean }
      berkas_wajib: {
        Args: { p_wajib_sertifikat: boolean }
        Returns: Database["public"]["Enums"]["jenis_berkas"][]
      }
      boleh_akses_peserta: { Args: { p_peserta_id: string }; Returns: boolean }
      boleh_ubah_berkas: { Args: { p_peserta_id: string }; Returns: boolean }
      cek_cakupan_penguji: {
        Args: { p_tingkat_id: string }
        Returns: {
          dari: number
          jenis: string
          sampai: number
        }[]
      }
      dojo_saya: { Args: never; Returns: string }
      hasil_tingkat_ditutup: {
        Args: { p_peserta_id: string }
        Returns: boolean
      }
      peran_saya: { Args: never; Returns: Database["public"]["Enums"]["peran"] }
      peserta_dalam_tugas_saya: {
        Args: { p_peserta_id: string }
        Returns: boolean
      }
      peserta_id_dari_path: { Args: { p_name: string }; Returns: string }
      simpan_penilaian: { Args: { p_items: Json }; Returns: string[] }
      terbitkan_nomor_dada: {
        Args: { p_dojo_id: string; p_event_id: string; p_tingkat_id: string }
        Returns: {
          jumlah: number
          no_akhir: number
          no_awal: number
        }[]
      }
      tolak_peserta: {
        Args: {
          p_alasan: string
          p_jenis_ditolak?: Database["public"]["Enums"]["jenis_berkas"][]
          p_peserta_id: string
          p_tolak_pembayaran?: boolean
        }
        Returns: undefined
      }
      verifikasi_massal: {
        Args: { p_peserta_ids: string[] }
        Returns: {
          dilewati: number
          diproses: number
        }[]
      }
    }
    Enums: {
      jenis_berkas:
        | "pas_foto"
        | "akta_atau_kk"
        | "surat_sehat"
        | "sertifikat_terakhir"
      jenis_kelamin: "L" | "P"
      peran: "peserta" | "dojo" | "penguji" | "kontingen"
      status_batch: "terbuka" | "dikunci"
      status_berkas: "menunggu" | "diterima" | "ditolak"
      status_event:
        | "draft"
        | "pendaftaran_dibuka"
        | "pendaftaran_ditutup"
        | "berlangsung"
        | "selesai"
      status_pembayaran: "menunggu" | "lunas" | "ditolak"
      status_peserta:
        | "draft"
        | "menunggu_verifikasi"
        | "ditolak"
        | "terverifikasi"
        | "layak_ujian"
        | "dinilai"
        | "lulus"
        | "tidak_lulus"
        | "batal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      jenis_berkas: [
        "pas_foto",
        "akta_atau_kk",
        "surat_sehat",
        "sertifikat_terakhir",
      ],
      jenis_kelamin: ["L", "P"],
      peran: ["peserta", "dojo", "penguji", "kontingen"],
      status_batch: ["terbuka", "dikunci"],
      status_berkas: ["menunggu", "diterima", "ditolak"],
      status_event: [
        "draft",
        "pendaftaran_dibuka",
        "pendaftaran_ditutup",
        "berlangsung",
        "selesai",
      ],
      status_pembayaran: ["menunggu", "lunas", "ditolak"],
      status_peserta: [
        "draft",
        "menunggu_verifikasi",
        "ditolak",
        "terverifikasi",
        "layak_ujian",
        "dinilai",
        "lulus",
        "tidak_lulus",
        "batal",
      ],
    },
  },
} as const
