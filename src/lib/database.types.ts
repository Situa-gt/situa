export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          created_at: string
          display_order: number
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string
          content: string
          cover_url: string | null
          cover_alt: string | null
          seo_title: string | null
          seo_description: string | null
          is_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string
          content?: string
          cover_url?: string | null
          cover_alt?: string | null
          seo_title?: string | null
          seo_description?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string
          content?: string
          cover_url?: string | null
          cover_alt?: string | null
          seo_title?: string | null
          seo_description?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ayuda_leads: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          message: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone: string
          message?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string
          message?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
        }
        Relationships: []
      }
      developer_leads: {
        Row: {
          id: string
          developer_name: string
          contact_name: string
          phone: string
          website: string | null
          discount_code: string | null
          message: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          developer_name: string
          contact_name: string
          phone: string
          website?: string | null
          discount_code?: string | null
          message?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          developer_name?: string
          contact_name?: string
          phone?: string
          website?: string | null
          discount_code?: string | null
          message?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          project_id: string | null
          model_id: string | null
          filters: Json | null
          session_id: string | null
          page_path: string | null
          referrer: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_term: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          project_id?: string | null
          model_id?: string | null
          filters?: Json | null
          session_id?: string | null
          page_path?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_term?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          project_id?: string | null
          model_id?: string | null
          filters?: Json | null
          session_id?: string | null
          page_path?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_term?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          }
        ]
      }
      bubble_migration_log: {
        Row: {
          bubble_id: string
          id: string
          migrated_at: string
          supabase_id: string
          table_name: string
        }
        Insert: {
          bubble_id: string
          id?: string
          migrated_at?: string
          supabase_id: string
          table_name: string
        }
        Update: {
          bubble_id?: string
          id?: string
          migrated_at?: string
          supabase_id?: string
          table_name?: string
        }
        Relationships: []
      }
      contact_leads: {
        Row: {
          channel: Database["public"]["Enums"]["lead_channel"]
          created_at: string
          email_attempted_at: string | null
          email_error: string | null
          email_sent_at: string | null
          email: string
          full_name: string
          id: string
          ip_address: string | null
          message: string | null
          model_id: string | null
          phone: string | null
          project_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          channel?: Database["public"]["Enums"]["lead_channel"]
          created_at?: string
          email_attempted_at?: string | null
          email_error?: string | null
          email_sent_at?: string | null
          email: string
          full_name: string
          id?: string
          ip_address?: string | null
          message?: string | null
          model_id?: string | null
          phone?: string | null
          project_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["lead_channel"]
          created_at?: string
          email_attempted_at?: string | null
          email_error?: string | null
          email_sent_at?: string | null
          email?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          message?: string | null
          model_id?: string | null
          phone?: string | null
          project_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_leads_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      developers: {
        Row: {
          contact_email: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notification_emails: string[] | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notification_emails?: string[] | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notification_emails?: string[] | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      project_contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_redirects: {
        Row: {
          created_at: string
          hits: number
          id: string
          new_path: string
          old_path: string
          status_code: number
        }
        Insert: {
          created_at?: string
          hits?: number
          id?: string
          new_path: string
          old_path: string
          status_code?: number
        }
        Update: {
          created_at?: string
          hits?: number
          id?: string
          new_path?: string
          old_path?: string
          status_code?: number
        }
        Relationships: []
      }
      models: {
        Row: {
          amenities: string[]
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          description: string | null
          display_order: number
          has_balcony: boolean
          has_service_room: boolean
          id: string
          is_active: boolean
          is_featured: boolean
          legacy_slugs: string[]
          monthly_payment_from: number | null
          name: string
          parking_spots: number
          price_from: number
          project_id: string
          size_m2: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          display_order?: number
          has_balcony?: boolean
          has_service_room?: boolean
          id?: string
          is_active?: boolean
          is_featured?: boolean
          legacy_slugs?: string[]
          monthly_payment_from?: number | null
          name: string
          parking_spots?: number
          price_from: number
          project_id: string
          size_m2?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          display_order?: number
          has_balcony?: boolean
          has_service_room?: boolean
          id?: string
          is_active?: boolean
          is_featured?: boolean
          legacy_slugs?: string[]
          monthly_payment_from?: number | null
          name?: string
          parking_spots?: number
          price_from?: number
          project_id?: string
          size_m2?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          department_id: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          department_id: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          department_id?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipalities_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      project_media: {
        Row: {
          alt: string | null
          blur_data_url: string | null
          created_at: string
          developer_id: string | null
          display_order: number
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          model_id: string | null
          project_id: string | null
          url: string
          url_md: string | null
          url_sm: string | null
          width: number | null
        }
        Insert: {
          alt?: string | null
          blur_data_url?: string | null
          created_at?: string
          developer_id?: string | null
          display_order?: number
          height?: number | null
          id?: string
          kind: Database["public"]["Enums"]["media_kind"]
          model_id?: string | null
          project_id?: string | null
          url: string
          url_md?: string | null
          url_sm?: string | null
          width?: number | null
        }
        Update: {
          alt?: string | null
          blur_data_url?: string | null
          created_at?: string
          developer_id?: string | null
          display_order?: number
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          model_id?: string | null
          project_id?: string | null
          url?: string
          url_md?: string | null
          url_sm?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_media_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_media_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_amenities: {
        Row: {
          amenity_id: string
          created_at: string
          display_order: number
          project_id: string
        }
        Insert: {
          amenity_id: string
          created_at?: string
          display_order?: number
          project_id: string
        }
        Update: {
          amenity_id?: string
          created_at?: string
          display_order?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_amenities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address_text: string | null
          amenities: string[] | null
          base_currency: Database["public"]["Enums"]["currency_code"]
          created_at: string
          description: string | null
          developer_id: string
          exchange_rate: number
          featured_priority: number
          featured_until: string | null
          google_maps_url: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          latitude: number | null
          legacy_slugs: string[]
          longitude: number | null
          name: string
          property_type: Database["public"]["Enums"]["property_type"]
          publicidad_banner: boolean
          short_description: string | null
          slug: string
          stage: Database["public"]["Enums"]["project_stage"]
          updated_at: string
          zone_id: string
        }
        Insert: {
          address_text?: string | null
          amenities?: string[] | null
          base_currency?: Database["public"]["Enums"]["currency_code"]
          created_at?: string
          description?: string | null
          developer_id: string
          exchange_rate?: number
          featured_priority?: number
          featured_until?: string | null
          google_maps_url?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          latitude?: number | null
          legacy_slugs?: string[]
          longitude?: number | null
          name: string
          property_type: Database["public"]["Enums"]["property_type"]
          publicidad_banner?: boolean
          short_description?: string | null
          slug: string
          stage: Database["public"]["Enums"]["project_stage"]
          updated_at?: string
          zone_id: string
        }
        Update: {
          address_text?: string | null
          amenities?: string[] | null
          base_currency?: Database["public"]["Enums"]["currency_code"]
          created_at?: string
          description?: string | null
          developer_id?: string
          exchange_rate?: number
          featured_priority?: number
          featured_until?: string | null
          google_maps_url?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          latitude?: number | null
          legacy_slugs?: string[]
          longitude?: number | null
          name?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          publicidad_banner?: boolean
          short_description?: string | null
          slug?: string
          stage?: Database["public"]["Enums"]["project_stage"]
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          display_order: number
          id: string
          is_active: boolean
          is_canonical_for_slug: boolean
          municipality_id: string
          name: string
          slug: string
          url_slug: string
        }
        Insert: {
          display_order?: number
          id?: string
          is_active?: boolean
          is_canonical_for_slug?: boolean
          municipality_id: string
          name: string
          slug: string
          url_slug: string
        }
        Update: {
          display_order?: number
          id?: string
          is_active?: boolean
          is_canonical_for_slug?: boolean
          municipality_id?: string
          name?: string
          slug?: string
          url_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      analytics_event_type:
        | "project_view"
        | "model_view"
        | "search"
        | "contact_form_start"
        | "contact_form_submit"
        | "suggested_project_impression"
        | "suggested_project_click"
        | "calculator_submit"
      currency_code: "USD" | "GTQ"
      lead_channel: "form"
      media_kind: "cover" | "gallery" | "floorplan" | "logo"
      project_stage:
        | "lanzamiento"
        | "preventa"
        | "construccion"
        | "entrega_inmediata"
      property_type: "apartamento" | "casa"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      analytics_event_type: [
        "project_view",
        "model_view",
        "search",
        "contact_form_start",
        "contact_form_submit",
        "suggested_project_impression",
        "suggested_project_click",
        "calculator_submit",
      ],
      currency_code: ["USD", "GTQ"],
      lead_channel: ["form"],
      media_kind: ["cover", "gallery", "floorplan", "logo"],
      project_stage: [
        "lanzamiento",
        "preventa",
        "construccion",
        "entrega_inmediata",
      ],
      property_type: ["apartamento", "casa"],
    },
  },
} as const
