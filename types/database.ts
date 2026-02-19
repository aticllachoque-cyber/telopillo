export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          condition: string
          contacts_count: number
          created_at: string
          currency: string
          description: string
          embedding: string | null
          expires_at: string
          favorites_count: number
          id: string
          images: string[]
          location_city: string
          location_department: string
          price: number
          search_vector: unknown
          status: string
          subcategory: string | null
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          category: string
          condition: string
          contacts_count?: number
          created_at?: string
          currency?: string
          description: string
          embedding?: string | null
          expires_at?: string
          favorites_count?: number
          id?: string
          images?: string[]
          location_city: string
          location_department: string
          price: number
          search_vector?: unknown
          status?: string
          subcategory?: string | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          category?: string
          condition?: string
          contacts_count?: number
          created_at?: string
          currency?: string
          description?: string
          embedding?: string | null
          expires_at?: string
          favorites_count?: number
          id?: string
          images?: string[]
          location_city?: string
          location_department?: string
          price?: number
          search_vector?: unknown
          status?: string
          subcategory?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: 'products_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      business_profiles: {
        Row: {
          id: string
          business_name: string
          slug: string
          business_description: string | null
          business_category: string | null
          nit: string | null
          business_logo_url: string | null
          website_url: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_tiktok: string | null
          social_whatsapp: string | null
          business_hours: Json | null
          business_address: string | null
          business_department: string | null
          business_city: string | null
          is_nit_verified: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          business_name: string
          slug: string
          business_description?: string | null
          business_category?: string | null
          nit?: string | null
          business_logo_url?: string | null
          website_url?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          social_whatsapp?: string | null
          business_hours?: Json | null
          business_address?: string | null
          business_department?: string | null
          business_city?: string | null
          is_nit_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          slug?: string
          business_description?: string | null
          business_category?: string | null
          nit?: string | null
          business_logo_url?: string | null
          website_url?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          social_whatsapp?: string | null
          business_hours?: Json | null
          business_address?: string | null
          business_department?: string | null
          business_city?: string | null
          is_nit_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'business_profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      demand_posts: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          category: string
          subcategory: string | null
          location_department: string
          location_city: string
          price_min: number | null
          price_max: number | null
          status: string
          offers_count: number
          embedding: string | null
          search_vector: unknown
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          category: string
          subcategory?: string | null
          location_department: string
          location_city: string
          price_min?: number | null
          price_max?: number | null
          status?: string
          offers_count?: number
          embedding?: string | null
          search_vector?: unknown
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          category?: string
          subcategory?: string | null
          location_department?: string
          location_city?: string
          price_min?: number | null
          price_max?: number | null
          status?: string
          offers_count?: number
          embedding?: string | null
          search_vector?: unknown
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'demand_posts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      demand_offers: {
        Row: {
          id: string
          demand_post_id: string
          product_id: string
          seller_id: string
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          demand_post_id: string
          product_id: string
          seller_id: string
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          demand_post_id?: string
          product_id?: string
          seller_id?: string
          message?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'demand_offers_demand_post_id_fkey'
            columns: ['demand_post_id']
            isOneToOne: false
            referencedRelation: 'demand_posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'demand_offers_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'demand_offers_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_verified: boolean | null
          location_city: string | null
          location_department: string | null
          phone: string | null
          phone_verified: boolean
          rating_average: number | null
          rating_count: number | null
          updated_at: string
          verification_level: number
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_verified?: boolean | null
          location_city?: string | null
          location_department?: string | null
          phone?: string | null
          phone_verified?: boolean
          rating_average?: number | null
          rating_count?: number | null
          updated_at?: string
          verification_level?: number
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_verified?: boolean | null
          location_city?: string | null
          location_department?: string | null
          phone?: string | null
          phone_verified?: boolean
          rating_average?: number | null
          rating_count?: number | null
          updated_at?: string
          verification_level?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_product_views: {
        Args: { product_id: string }
        Returns: undefined
      }
      search_products: {
        Args: {
          category_filter?: string
          condition_filter?: string
          location_department_filter?: string
          price_max?: number
          price_min?: number
          result_limit?: number
          result_offset?: number
          search_query?: string
          seller_type_filter?: string
          sort_by?: string
          status_filter?: string
        }
        Returns: {
          products: Json
          total_count: number
        }[]
      }
      search_demands_hybrid: {
        Args: {
          search_query?: string
          query_embedding?: string
          category_filter?: string
          department_filter?: string
          sort_by?: string
          result_limit?: number
          result_offset?: number
        }
        Returns: {
          demands: Json
          total_count: number
        }[]
      }
      search_products_semantic: {
        Args: {
          category_filter?: string
          condition_filter?: string
          location_department_filter?: string
          price_max?: number
          price_min?: number
          query_embedding?: string
          result_limit?: number
          result_offset?: number
          search_query?: string
          seller_type_filter?: string
          sort_by?: string
          status_filter?: string
        }
        Returns: {
          products: Json
          total_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

// ---------------------------------------------------------------------------
// SearchProduct: typed shape returned by search_products / search_products_semantic RPCs
// ---------------------------------------------------------------------------
export interface SearchProduct {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  subcategory: string | null
  price: number
  currency: string
  condition: string
  location_department: string
  location_city: string
  images: string[]
  status: string
  views_count: number
  favorites_count: number
  contacts_count: number
  created_at: string
  updated_at: string
  expires_at: string | null
  relevance_score: number
  // Seller info (joined from profiles + business_profiles)
  seller_name: string | null
  seller_avatar_url: string | null
  seller_verification_level: number
  seller_business_name: string | null
  seller_business_slug: string | null
  seller_business_logo: string | null
}

// ---------------------------------------------------------------------------
// DemandPost: row shape for the demand_posts table (M4.7)
// ---------------------------------------------------------------------------
export interface DemandPost {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  subcategory: string | null
  location_department: string
  location_city: string
  price_min: number | null
  price_max: number | null
  status: 'active' | 'found' | 'deleted'
  offers_count: number
  embedding: string | null
  search_vector: unknown
  expires_at: string
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// DemandOffer: row shape for the demand_offers table (M4.7)
// ---------------------------------------------------------------------------
export interface DemandOffer {
  id: string
  demand_post_id: string
  product_id: string
  seller_id: string
  message: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// SearchDemandPost: typed shape returned by search_demands_hybrid RPC
// ---------------------------------------------------------------------------
export interface SearchDemandPost {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  subcategory: string | null
  location_department: string
  location_city: string
  price_min: number | null
  price_max: number | null
  status: string
  offers_count: number
  expires_at: string
  created_at: string
  updated_at: string
  relevance_score: number
  poster_name: string | null
  poster_avatar_url: string | null
  poster_phone: string | null
  poster_verification_level: number
  poster_business_name: string | null
  poster_business_slug: string | null
}

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
