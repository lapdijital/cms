"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Edit,
  FileText,
  Filter,
  Loader2,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Post interface to match backend response
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: { blocks: Array<{ type: string; data: unknown }> }; // Content alanı eklendi
  status: string;
  type: string;
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  commentsCount: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    noIndex?: boolean;
    noFollow?: boolean;
  };
}

interface PostEditorProps {
  post: {
    id?: string;
    title?: string;
    excerpt?: string;
    status?: string;
    featuredImage?: string;
    tags?: string[];
    content?: { blocks: Array<{ type: string; data: unknown }> };
    publishedAt?: string;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string;
      canonicalUrl?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
      twitterTitle?: string;
      twitterDescription?: string;
      noIndex?: boolean;
      noFollow?: boolean;
    };
  } | null;
  onBack: () => void;
  siteName: string;
}

function PostEditor({ post, onBack, siteName }: PostEditorProps) {
  const editorRef = useRef<{
    save: () => Promise<{ blocks: Array<{ type: string; data: unknown }> }>;
    destroy: () => Promise<void>;
    isReady: Promise<void>;
  } | null>(null); // EditorJS instance
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [postData, setPostData] = useState({
    title: post?.title || "",
    excerpt: post?.excerpt || "",
    status: post?.status || "DRAFT",
    featuredImage: post?.featuredImage || "",
    tags: post?.tags?.join(", ") || "",
    seo: {
      metaTitle: post?.seo?.metaTitle || "",
      metaDescription: post?.seo?.metaDescription || "",
      keywords: post?.seo?.keywords || "",
      canonicalUrl: post?.seo?.canonicalUrl || "",
      ogTitle: post?.seo?.ogTitle || "",
      ogDescription: post?.seo?.ogDescription || "",
      ogImage: post?.seo?.ogImage || "",
      twitterTitle: post?.seo?.twitterTitle || "",
      twitterDescription: post?.seo?.twitterDescription || "",
      noIndex: post?.seo?.noIndex || false,
      noFollow: post?.seo?.noFollow || false,
    },
  });

  // SEO skorunu gerçek zamanlı güncellemek için useEffect
  useEffect(() => {
    const newScore = calculateSeoScore(postData.seo);
    setSeoScore(newScore);
  }, [postData.seo]);

  // Load EditorJS
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let editorInstance: any = null;
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 50; // 5 saniye max bekleme (50 * 100ms)

    const loadEditor = async () => {
      try {
        // Check if DOM element exists using ref
        const containerElement = editorContainerRef.current;
        if (!containerElement) {
          // console.log("Editor container not found, waiting...");
          return false;
        }

        // Check if editor-js div exists
        const editorElement = containerElement.querySelector("#editor-js");
        if (!editorElement) {
          // console.log("Editor element not found, waiting...");
          return false;
        }

        // console.log("DOM elements found, initializing editor...");
        setIsEditorLoading(true);

        // Destroy existing editor if any
        if (editorRef.current) {
          try {
            await editorRef.current.destroy();
          } catch {
            console.log("Previous editor cleanup");
          }
          editorRef.current = null;
        }

        const EditorJS = (await import("@editorjs/editorjs")).default;
        const Header = (await import("@editorjs/header")).default;
        const List = (await import("@editorjs/list")).default;
        const Paragraph = (await import("@editorjs/paragraph")).default;
        const Quote = (await import("@editorjs/quote")).default;
        const Code = (await import("@editorjs/code")).default;
        const Delimiter = (await import("@editorjs/delimiter")).default;
        const ImageTool = (await import("@editorjs/image")).default;

        editorInstance = new EditorJS({
          holder: "editor-js",
          placeholder: "Yazınızı buraya yazın...",
          minHeight: 400,
          i18n: {
            messages: {
              ui: {
                blockTunes: {
                  toggler: {
                    "Click to tune": "Seçenekleri Gör",
                    "or drag to move": "ya da taşı",
                  },
                },
                inlineToolbar: {
                  "Convert to": "Dönüştür",
                },
                toolbar: {
                  toolbox: {
                    Add: "Ekle",
                  },
                },
              },
              toolNames: {
                Text: "Metin",
                Heading: "Başlık",
                List: "Liste",
                Quote: "Alıntı",
                Code: "Kod",
                Link: "Bağlantı",
                Image: "Görsel",
                Delimiter: "Ayraç",
                Table: "Tablo",
                Marker: "Vurgula",
                Bold: "Kalın",
                Italic: "İtalik",
                Underline: "Altı çizili",
                "Unordered list": "Sırasız liste",
                "Ordered list": "Sıralı liste",
                "Check list": "Kontrol listesi",
              },
              tools: {
                warning: {
                  Title: "Başlık",
                  Message: "Mesaj",
                },
                link: {
                  "Add a link": "Bağlantı ekle",
                },
                stub: {
                  "The block can not be displayed correctly.":
                    "Bu blok doğru şekilde gösterilemiyor.",
                },
              },
              blockTunes: {
                delete: {
                  Delete: "Sil",
                },
                moveUp: {
                  "Move up": "Yukarı taşı",
                },
                moveDown: {
                  "Move down": "Aşağı taşı",
                },
              },
            },
          },
          tools: {
            header: Header,
            list: List,
            paragraph: Paragraph,
            quote: Quote,
            code: Code,
            delimiter: Delimiter,
            image: {
              class: ImageTool,
              config: {
                endpoints: {
                  byFile: `${process.env.NEXT_PUBLIC_API_URL}/api/upload/upload-image-editorjs`,
                },
                field: "image",
                types: "image/*",
              },
            },
          } as const,
          data: post?.content || { blocks: [] },
          onChange: () => {
            //console.log("Editor content changed");
          },
        });

        // Wait for editor to be ready
        await editorInstance.isReady;
        editorRef.current = editorInstance;
        setIsEditorLoading(false);
        // console.log("Editor is ready!");
        return true;
      } catch (error) {
        console.error("Editor yüklenirken hata:", error);
        setIsEditorLoading(false); // Hata durumunda da loading'i kapat
        return false;
      }
    };

    // Try to load editor after a delay to ensure DOM is ready
    const tryLoadEditor = async () => {
      /* console.log(
        `Attempting to load editor... (try ${retryCount + 1}/${maxRetries})`
      );
      */
      retryCount++;

      const success = await loadEditor();
      if (!success) {
        if (retryCount >= maxRetries) {
          console.error("Editor load failed after maximum retries");
          setIsEditorLoading(false);
          return;
        }
        console.log("Editor load failed, retrying in 100ms...");
        // Retry after a short delay
        timeoutId = setTimeout(tryLoadEditor, 100);
      }
    };

    // Start trying to load editor after component mount
    timeoutId = setTimeout(tryLoadEditor, 100); // Reduce initial delay

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (editorRef.current) {
        try {
          const currentEditor = editorRef.current;
          editorRef.current = null; // Önce ref'i temizle

          if (currentEditor && typeof currentEditor.destroy === "function") {
            Promise.resolve(currentEditor.destroy()).catch((error) => {
              console.log("Editor destroy error handled:", error);
            });
          }
        } catch (error) {
          console.log("Editor cleanup error handled:", error);
        }
      }
    };
  }, [post?.id, post?.content]); // Remove isLoading from dependencies

  const handleSave = async () => {
    if (!editorRef.current || typeof editorRef.current.save !== "function") {
      alert("Editör henüz hazır değil. Lütfen bekleyin...");
      return;
    }

    setIsSaving(true);
    try {
      const outputData = await editorRef.current.save();

      const postToSave = {
        ...postData,
        content: outputData,
        slug: postData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        tags: postData.tags
          .split(",")
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag),
        seo: {
          ...postData.seo,
          // Auto-fill missing SEO fields with defaults
          metaTitle: postData.seo.metaTitle || postData.title,
          metaDescription: postData.seo.metaDescription || postData.excerpt,
          ogTitle:
            postData.seo.ogTitle || postData.seo.metaTitle || postData.title,
          ogDescription:
            postData.seo.ogDescription ||
            postData.seo.metaDescription ||
            postData.excerpt,
          ogImage: postData.seo.ogImage || postData.featuredImage,
          twitterTitle:
            postData.seo.twitterTitle ||
            postData.seo.ogTitle ||
            postData.seo.metaTitle ||
            postData.title,
          twitterDescription:
            postData.seo.twitterDescription ||
            postData.seo.ogDescription ||
            postData.seo.metaDescription ||
            postData.excerpt,
        },
        publishedAt:
          postData.status === "PUBLISHED"
            ? new Date().toISOString()
            : post?.publishedAt,
      };

      // API'ye kaydet
      const url = post?.id
        ? `${process.env.NEXT_PUBLIC_API_URL}/posts/${post.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/posts`;

      const method = post?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(postToSave),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Backend response:", result);
        if (result.success) {
          alert(
            post?.id
              ? "Yazı başarıyla güncellendi!"
              : "Yazı başarıyla oluşturuldu!"
          );
          onBack();
        } else {
          alert("Hata: " + (result.error || "Bilinmeyen hata"));
        }
      } else {
        const errorData = await response.json();
        alert("Kaydetme hatası: " + (errorData.error || response.statusText));
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      alert("Kaydetme sırasında hata oluştu: " + error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload/upload-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();
      if (result.success) {
        setPostData((prev) => ({ ...prev, featuredImage: result.data.url }));
      } else {
        console.error("Upload failed:", result.error);
        alert("Resim yükleme başarısız: " + result.error);
      }
    } catch (error) {
      console.error("Resim yükleme hatası:", error);
      alert("Resim yükleme hatası: " + error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {post ? "Yazıyı Düzenle" : "Yeni Yazı"}
            </h1>
            <p className="text-muted-foreground">{siteName}</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Kaydet
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle>Yazı Başlığı</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={postData.title}
                onChange={(e) =>
                  setPostData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Başlık girin..."
                className="text-lg font-semibold"
              />
            </CardContent>
          </Card>

          {/* Editor */}
          <Card>
            <CardHeader>
              <CardTitle>İçerik</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={editorContainerRef}>
                {isEditorLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mr-2" />
                    <span>Editör yükleniyor...</span>
                  </div>
                ) : null}
                <div
                  id="editor-js"
                  className="min-h-[400px]"
                  style={{ display: isEditorLoading ? "none" : "block" }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Post Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Yayın Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Durum</Label>
                <Select
                  value={postData.status}
                  onValueChange={(value) =>
                    setPostData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Taslak</SelectItem>
                    <SelectItem value="PUBLISHED">Yayınla</SelectItem>
                    <SelectItem value="ARCHIVED">Arşivle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="excerpt">Kısa Açıklama</Label>
                <Textarea
                  id="excerpt"
                  value={postData.excerpt}
                  onChange={(e) =>
                    setPostData((prev) => ({
                      ...prev,
                      excerpt: e.target.value,
                    }))
                  }
                  placeholder="Yazının özeti..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Kapak Resmi</CardTitle>
            </CardHeader>
            <CardContent>
              {postData.featuredImage ? (
                <div className="space-y-2">
                  <Image
                    src={postData.featuredImage}
                    alt="Kapak resmi"
                    width={300}
                    height={200}
                    className="w-full rounded-lg object-cover"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPostData((prev) => ({ ...prev, featuredImage: "" }))
                    }
                  >
                    Resmi Kaldır
                  </Button>
                </div>
              ) : (
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG, GIF dosyaları (Max 5MB)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                SEO Ayarları
                <div className="ml-auto flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${getSeoScoreColor(seoScore)}`}
                  />
                  <span className="text-sm font-normal">{seoScore}%</span>
                </div>
              </CardTitle>
              <CardDescription>
                Arama motoru optimizasyonu için meta verileri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Başlık</Label>
                <Input
                  id="metaTitle"
                  value={postData.seo.metaTitle}
                  onChange={(e) =>
                    setPostData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, metaTitle: e.target.value },
                    }))
                  }
                  placeholder={postData.title || "Yazı başlığı..."}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {postData.seo.metaTitle.length}/60 karakter (Önerilen: 50-60)
                  {postData.seo.metaTitle.length >= 30 &&
                  postData.seo.metaTitle.length <= 60
                    ? " Optimal uzunluk!"
                    : ""}
                </p>
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Açıklama</Label>
                <Textarea
                  id="metaDescription"
                  value={postData.seo.metaDescription}
                  onChange={(e) =>
                    setPostData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, metaDescription: e.target.value },
                    }))
                  }
                  placeholder={postData.excerpt || "Yazı açıklaması..."}
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {postData.seo.metaDescription.length}/160 karakter (Önerilen:
                  150-160)
                  {postData.seo.metaDescription.length >= 120 &&
                  postData.seo.metaDescription.length <= 160
                    ? " Optimal uzunluk!"
                    : ""}
                </p>
              </div>

              <div>
                <Label htmlFor="keywords">Anahtar Kelimeler</Label>
                <Input
                  id="keywords"
                  value={postData.seo.keywords}
                  onChange={(e) =>
                    setPostData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, keywords: e.target.value },
                    }))
                  }
                  placeholder="kelime1, kelime2, kelime3"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Virgülle ayırarak yazın
                  {postData.seo.keywords && postData.seo.keywords.trim()
                    ? " Anahtar kelimeler eklendi!"
                    : " ⚠️ Anahtar kelimeler eksik"}
                </p>
              </div>

              <div>
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  value={postData.seo.canonicalUrl}
                  onChange={(e) =>
                    setPostData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, canonicalUrl: e.target.value },
                    }))
                  }
                  placeholder="https://example.com/post-url"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {postData.seo.canonicalUrl && postData.seo.canonicalUrl.trim()
                    ? "Canonical URL eklendi"
                    : "⚠️ Canonical URL eksik"}
                </p>
              </div>

              {/* SEO Completion Bonus Info */}
              {postData.seo.metaTitle &&
              postData.seo.metaDescription &&
              postData.seo.keywords &&
              postData.seo.ogTitle &&
              postData.seo.ogDescription &&
              postData.seo.twitterTitle &&
              postData.seo.twitterDescription &&
              postData.seo.canonicalUrl ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700 font-medium">
                    Mükemmel! Tüm SEO alanları tamamlandı
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Artık maksimum SEO skoruna ulaştınız!
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700 font-medium">
                    💡 Tüm alanları doldurun ve +5 bonus puan kazanın!
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Eksik alanlar:{" "}
                    {[
                      !postData.seo.metaTitle && "Meta Başlık",
                      !postData.seo.metaDescription && "Meta Açıklama",
                      !postData.seo.keywords?.trim() && "Anahtar Kelimeler",
                      !postData.seo.ogTitle && "OG Başlık",
                      !postData.seo.ogDescription && "OG Açıklama",
                      !postData.seo.twitterTitle && "Twitter Başlık",
                      !postData.seo.twitterDescription && "Twitter Açıklama",
                      !postData.seo.canonicalUrl?.trim() && "Canonical URL",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="noIndex"
                    checked={postData.seo.noIndex}
                    onCheckedChange={(checked) =>
                      setPostData((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, noIndex: !!checked },
                      }))
                    }
                  />
                  <Label htmlFor="noIndex" className="text-sm">
                    No Index (Arama motorlarında gösterme)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="noFollow"
                    checked={postData.seo.noFollow}
                    onCheckedChange={(checked) =>
                      setPostData((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, noFollow: !!checked },
                      }))
                    }
                  />
                  <Label htmlFor="noFollow" className="text-sm">
                    No Follow (Bağlantıları takip etme)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Sosyal Medya Önizleme</CardTitle>
              <CardDescription>
                Facebook, Twitter vb. paylaşımlar için
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ogTitle">Open Graph Başlık</Label>
                <Input
                  id="ogTitle"
                  value={postData.seo.ogTitle}
                  onChange={(e) =>
                    setPostData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, ogTitle: e.target.value },
                    }))
                  }
                  placeholder={
                    postData.seo.metaTitle || postData.title || "Başlık..."
                  }
                />
              </div>

              <div>
                <Label htmlFor="ogDescription">Open Graph Açıklama</Label>
                <Textarea
                  id="ogDescription"
                  value={postData.seo.ogDescription}
                  onChange={(e) =>
                    setPostData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, ogDescription: e.target.value },
                    }))
                  }
                  placeholder={
                    postData.seo.metaDescription ||
                    postData.excerpt ||
                    "Açıklama..."
                  }
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {postData.seo.ogTitle && postData.seo.ogDescription
                    ? "Open Graph tamamlandı"
                    : "⚠️ Her iki alan da doldurulmalı"}
                </p>
              </div>

              <div>
                <Label htmlFor="ogImage">Open Graph Resim URL</Label>
                <Input
                  id="ogImage"
                  value={postData.seo.ogImage}
                  onChange={(e) =>
                    setPostData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, ogImage: e.target.value },
                    }))
                  }
                  placeholder={
                    postData.featuredImage || "https://example.com/image.jpg"
                  }
                />
              </div>

              <div>
                <Label htmlFor="twitterTitle">Twitter Başlık</Label>
                <Input
                  id="twitterTitle"
                  value={postData.seo.twitterTitle}
                  onChange={(e) =>
                    setPostData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, twitterTitle: e.target.value },
                    }))
                  }
                  placeholder={
                    postData.seo.ogTitle ||
                    postData.seo.metaTitle ||
                    postData.title ||
                    "Başlık..."
                  }
                />
              </div>

              <div>
                <Label htmlFor="twitterDescription">Twitter Açıklama</Label>
                <Textarea
                  id="twitterDescription"
                  value={postData.seo.twitterDescription}
                  onChange={(e) =>
                    setPostData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, twitterDescription: e.target.value },
                    }))
                  }
                  placeholder={
                    postData.seo.ogDescription ||
                    postData.seo.metaDescription ||
                    postData.excerpt ||
                    "Açıklama..."
                  }
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {postData.seo.twitterTitle && postData.seo.twitterDescription
                    ? "Twitter kartları tamamlandı"
                    : "⚠️ Her iki alan da doldurulmalı"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "default";
    case "DRAFT":
      return "secondary";
    case "ARCHIVED":
      return "outline";
    default:
      return "secondary";
  }
}

function calculateSeoScore(seo?: {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}) {
  if (!seo) return 0;

  let score = 0;
  const maxScore = 100;

  // Meta title check (25 points)
  if (seo.metaTitle) {
    score += 20;
    if (seo.metaTitle.length >= 30 && seo.metaTitle.length <= 60) {
      score += 5; // Bonus for optimal length
    }
  }

  // Meta description check (25 points)
  if (seo.metaDescription) {
    score += 20;
    if (
      seo.metaDescription.length >= 120 &&
      seo.metaDescription.length <= 160
    ) {
      score += 5; // Bonus for optimal length
    }
  }

  // Keywords check (15 points)
  if (seo.keywords && seo.keywords.trim()) {
    score += 15;
  }

  // Open Graph tags (15 points)
  if (seo.ogTitle && seo.ogDescription) {
    score += 15;
  }

  // Twitter tags (10 points)
  if (seo.twitterTitle && seo.twitterDescription) {
    score += 10;
  }

  // Canonical URL (5 points)
  if (seo.canonicalUrl && seo.canonicalUrl.trim()) {
    score += 5;
  }

  // Extra points for complete SEO setup (5 points)
  // All core fields filled bonus
  if (
    seo.metaTitle &&
    seo.metaDescription &&
    seo.keywords &&
    seo.ogTitle &&
    seo.ogDescription &&
    seo.twitterTitle &&
    seo.twitterDescription &&
    seo.canonicalUrl
  ) {
    score += 5;
  }

  // Robot tags penalty (if both noIndex and noFollow are true, -5 points)
  if (seo.noIndex && seo.noFollow) {
    score -= 5;
  }

  return Math.min(Math.max(score, 0), maxScore);
}

function getSeoScoreColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function PostsPageContent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showEditor, setShowEditor] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<{
    id?: string;
    title?: string;
    excerpt?: string;
    status?: string;
    featuredImage?: string;
    tags?: string[];
    content?: { blocks: Array<{ type: string; data: unknown }> };
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string;
      canonicalUrl?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
      twitterTitle?: string;
      twitterDescription?: string;
      noIndex?: boolean;
      noFollow?: boolean;
    };
  } | null>(null);

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/my`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.posts) {
          setPosts(data.posts);
        }
      } else {
        console.error("Failed to fetch posts:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleNewPost = () => {
    setEditingPost(null);
    setShowEditor(true);
  };

  const handleEditPost = (post: Post) => {
    console.log("Editing post:", post); // Debug için
    setEditingPost({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content, // Content'i dahil et
      status: post.status,
      featuredImage: post.featuredImage,
      tags: post.tags.map((tag) => tag.name),
      seo: post.seo,
    });
    setShowEditor(true);
  };

  const handleDeletePost = async (post: Post) => {
    if (
      !confirm(
        `"${post.title}" başlıklı yazıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert("Yazı başarıyla silindi!");
          fetchPosts(); // Listeyi yenile
        } else {
          alert("Silme hatası: " + (result.error || "Bilinmeyen hata"));
        }
      } else {
        const errorData = await response.json();
        alert("Silme hatası: " + (errorData.error || response.statusText));
      }
    } catch (error) {
      console.error("Silme hatası:", error);
      alert("Silme sırasında hata oluştu: " + error);
    }
  };

  if (showEditor) {
    return (
      <PostEditor
        post={editingPost}
        onBack={() => {
          setShowEditor(false);
          fetchPosts(); // Refresh posts after editing
        }}
        siteName={user?.site?.name || "Site"}
      />
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Yazılarım</h1>
        </div>
        <Button className="flex items-center space-x-2" onClick={handleNewPost}>
          <Plus className="h-4 w-4" />
          <span>Yeni Yazı</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Arama ve Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Yazı başlığı veya yazar ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Durum filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="PUBLISHED">Yayınlanan</SelectItem>
                <SelectItem value="DRAFT">Taslak</SelectItem>
                <SelectItem value="ARCHIVED">Arşivlenen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Yazı</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : posts.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yayınlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading
                ? "..."
                : posts.filter((p) => p.status === "PUBLISHED").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taslak</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading
                ? "..."
                : posts.filter((p) => p.status === "DRAFT").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Yazı Listesi ({filteredPosts.length})</CardTitle>
          <CardDescription>
            Tüm yazıları görüntüleyin ve yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Yazılar yükleniyor...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Yazar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>SEO</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {posts.length === 0
                        ? "Henüz yazı bulunmuyor. İlk yazınızı oluşturun!"
                        : "Arama kriterlerinize uygun yazı bulunamadı."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => {
                    const seoScore = calculateSeoScore(post.seo);
                    return (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">
                          {post.title}
                        </TableCell>
                        <TableCell>
                          {post.author.name || post.author.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(post.status)}>
                            {post.status === "PUBLISHED"
                              ? "Yayınlandı"
                              : post.status === "DRAFT"
                                ? "Taslak"
                                : "Arşivlendi"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${getSeoScoreColor(seoScore)}`}
                            />
                            <span className="text-sm">{seoScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            {new Date(post.createdAt).toLocaleDateString(
                              "tr-TR"
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPost(post)}
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeletePost(post)}
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PostsPage() {
  const { user } = useAuth();

  if (!user?.site) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Site Bulunamadı</CardTitle>
            <CardDescription>
              Yazı yönetimi için önce site ayarlarınızı tamamlamanız gerekiyor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/site-settings">Site Ayarlarına Git</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <PostsPageContent />;
}
