"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Save, X } from "lucide-react";
import { saveProductImagePaths, updateProduct, type ProductEditActionState } from "@/app/admin/products/actions";
import { createClient } from "@/lib/supabase/client";
import type { ProductDTO, ProductFamilyDTO } from "@/lib/products/types";

const initialState: ProductEditActionState = { error: "", success: "" };
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 5 * 1024 * 1024;
const maxImages = 8;
type NewImage = { file: File; previewUrl: string };

export function ProductEditor({ product, families, organizationId }: { product: ProductDTO; families: ProductFamilyDTO[]; organizationId: string }) {
  const newImagesRef = useRef<NewImage[]>([]);
  const [state, setState] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [keptPaths, setKeptPaths] = useState(product.imagePaths);
  const [newImages, setNewImages] = useState<NewImage[]>([]);

  useEffect(() => { newImagesRef.current = newImages; }, [newImages]);
  useEffect(() => () => newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)), []);

  function chooseImages(files: FileList | null) {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    if (keptPaths.length + newImages.length + selected.length > maxImages) return setState({ error: `Keep and upload no more than ${maxImages} images.`, success: "" });
    if (selected.some((file) => !allowedTypes.has(file.type) || file.size > maxImageBytes)) return setState({ error: "Every image must be a JPG, PNG, or WebP file no larger than 5 MB.", success: "" });
    setState(initialState);
    setNewImages((current) => [...current, ...selected.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
  }

  function removeNewImage(index: number) {
    setNewImages((current) => {
      URL.revokeObjectURL(current[index].previewUrl);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setState(initialState);
    const formData = new FormData(event.currentTarget);
    formData.delete("images");
    const details = await updateProduct(initialState, formData);
    if (details.error) { setState(details); setSaving(false); return; }

    const supabase = createClient();
    const uploadedPaths: string[] = [];
    try {
      for (const { file } of newImages) {
        const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
        const path = `${organizationId}/${product.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        uploadedPaths.push(path);
      }
      if (keptPaths.length !== product.imagePaths.length || uploadedPaths.length) await saveProductImagePaths(product.id, [...keptPaths, ...uploadedPaths]);
      newImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setNewImages([]);
      setKeptPaths((current) => [...current, ...uploadedPaths]);
      setState({ error: "", success: `${String(formData.get("name"))} and its image gallery were updated.` });
    } catch (error) {
      if (uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
      const reason = error instanceof Error ? error.message : "Unknown storage error";
      setState({ error: `The product details were saved, but the image gallery could not be updated: ${reason}`, success: "" });
    } finally {
      setSaving(false);
    }
  }

  return <form className="card form-stack product-edit-form" onSubmit={submit}>
    <input type="hidden" name="productId" value={product.id}/>
    <div className="grid grid-2"><div><label className="label" htmlFor="familyId">Product family</label><select className="input" id="familyId" name="familyId" required defaultValue={product.familyId || ""}><option value="" disabled>Choose a product family</option>{families.map((family) => <option value={family.id} key={family.id}>{family.name}</option>)}</select></div><div><label className="label" htmlFor="status">Status</label><select className="input" id="status" name="status" defaultValue={product.status === "Published" ? "published" : "draft"}><option value="draft">Draft</option><option value="published">Published</option></select></div></div>
    <div className="grid grid-2"><div><label className="label" htmlFor="name">Model name</label><input className="input" id="name" name="name" required defaultValue={product.name}/></div><div><label className="label" htmlFor="model">Configuration</label><input className="input" id="model" name="model" defaultValue={product.model}/></div></div>
    <div><label className="label" htmlFor="description">Description</label><textarea className="input" id="description" name="description" rows={4} defaultValue={product.description}/></div>
    <div className="grid grid-2"><div><label className="label" htmlFor="price">Starting price</label><input className="input" id="price" name="price" type="number" min="0" step="0.01" required defaultValue={product.price}/></div><div><label className="label" htmlFor="range">Frame</label><select className="input" id="range" name="range" defaultValue={product.range}><option value="">Choose frame</option><option>Powder Coated Steel</option><option>Aluminum</option></select></div><div><label className="label" htmlFor="seats">Capacity</label><select className="input" id="seats" name="seats" defaultValue={product.seats}><option value="">Choose capacity</option><option>2 Passengers</option><option>4 Passenger</option><option>6 Passengers</option></select></div><div><label className="label" htmlFor="powertrain">Powertrain</label><select className="input" id="powertrain" name="powertrain" defaultValue={product.powertrain}><option value="">Choose powertrain</option><option>48V</option><option>72V</option></select></div></div>
    <div className="grid grid-2"><div><label className="label" htmlFor="dimensions">Dimensions</label><input className="input" id="dimensions" name="dimensions" defaultValue={product.dimensions}/></div><div><label className="label" htmlFor="runningDistance">Running distance</label><input className="input" id="runningDistance" name="runningDistance" defaultValue={product.runningDistance}/></div><div><label className="label" htmlFor="turningRadius">Turning radius</label><input className="input" id="turningRadius" name="turningRadius" defaultValue={product.turningRadius}/></div><div><label className="label" htmlFor="maxLoadCapacity">Max load capacity</label><input className="input" id="maxLoadCapacity" name="maxLoadCapacity" defaultValue={product.maxLoadCapacity}/></div></div>
    <div><label className="label" htmlFor="highlights">Highlights</label><input className="input" id="highlights" name="highlights" defaultValue={product.highlights.join(", ")}/><small className="field-help">Separate features with commas.</small></div>
    <div><span className="label">Product images <span className="optional-label">Up to {maxImages}</span></span>
      {(keptPaths.length > 0 || newImages.length > 0) && <div className="product-image-preview-grid">
        {product.imagePaths.map((path, originalIndex) => keptPaths.includes(path) && <div className="product-image-preview-item" key={path}><span className="product-image-preview" style={{backgroundImage:`url(${product.imageUrls[originalIndex]})`}} role="img" aria-label={`Saved product image ${originalIndex + 1}`}/><button type="button" onClick={() => setKeptPaths((current) => current.filter((item) => item !== path))} aria-label={`Remove saved image ${originalIndex + 1}`}><X size={14}/></button></div>)}
        {newImages.map((image, index) => <div className="product-image-preview-item" key={image.previewUrl}><span className="product-image-preview" style={{backgroundImage:`url(${image.previewUrl})`}} role="img" aria-label={`New product image ${index + 1}`}/><button type="button" onClick={() => removeNewImage(index)} aria-label={`Remove new image ${index + 1}`}><X size={14}/></button></div>)}
      </div>}
      <label className="product-image-picker compact" htmlFor="edit-product-images"><span className="product-image-prompt"><ImagePlus size={22}/><strong>Add images</strong><small>Centered and scaled automatically · JPG, PNG, or WebP · 5 MB each</small></span></label>
      <input className="visually-hidden" id="edit-product-images" name="images" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => { chooseImages(event.target.files); event.target.value = ""; }}/>
    </div>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success" role="status">{state.success}</p>}
    <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <><LoaderCircle className="spin" size={16}/> Saving changes…</> : <><Save size={16}/> Save changes</>}</button>
  </form>;
}
