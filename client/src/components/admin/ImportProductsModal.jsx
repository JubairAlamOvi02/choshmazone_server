import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, FileText, Database, ArrowRight, RefreshCw, Check } from 'lucide-react';
import { parseUploadedProductFile } from '../../lib/serverProductExporter';
import { productParams } from '../../lib/api/products';
import { useToast } from '../../context/ToastContext';

const ImportProductsModal = ({ isOpen, onClose, onImportComplete }) => {
    const { showToast } = useToast ? useToast() : { showToast: null };
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [parsedProducts, setParsedProducts] = useState([]);
    const [parseError, setParseError] = useState(null);
    const [overwriteExisting, setOverwriteExisting] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (selectedFile) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setParseError(null);
        setImportResult(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const products = parseUploadedProductFile(content, selectedFile.name);
                if (!products || products.length === 0) {
                    throw new Error('No valid products found in this file.');
                }
                setParsedProducts(products);
            } catch (err) {
                console.error('File parsing error:', err);
                setParseError(err.message || 'Failed to parse file. Please ensure it is a valid JSON or CSV export.');
                setParsedProducts([]);
            }
        };
        reader.onerror = () => {
            setParseError('Failed to read the file.');
            setParsedProducts([]);
        };
        reader.readAsText(selectedFile, 'UTF-8');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleImport = async () => {
        if (!parsedProducts || parsedProducts.length === 0) return;

        try {
            setIsImporting(true);
            const result = await productParams.bulkImport(parsedProducts, {
                overwrite: overwriteExisting
            });

            setImportResult(result);
            if (showToast) {
                showToast(`Successfully imported ${result.inserted} products (${result.updated} updated)!`, 'success');
            }

            if (onImportComplete) {
                onImportComplete();
            }
        } catch (err) {
            console.error('Import failed:', err);
            setParseError(err.message || 'Failed to import products to server.');
            if (showToast) {
                showToast('Import failed. Please check error details.', 'error');
            }
        } finally {
            setIsImporting(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setParsedProducts([]);
        setParseError(null);
        setImportResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-start justify-between mb-5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                            <Upload size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-text-main font-outfit">Import Products</h2>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                    JSON / CSV
                                </span>
                            </div>
                            <p className="text-xs text-text-muted font-outfit mt-0.5">
                                Import products exported from Choshmazone Web directly into PostgreSQL.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        title="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content - Scrollable */}
                <div className="space-y-4 font-outfit overflow-y-auto pr-1 flex-1">
                    
                    {/* Step 1: Upload Dropzone if no file selected */}
                    {!file && (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                                isDragging 
                                    ? 'border-primary bg-primary/5 scale-[0.99]' 
                                    : 'border-border hover:border-primary/50 hover:bg-gray-50/50'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,.csv"
                                onChange={(e) => handleFileChange(e.target.files[0])}
                                className="hidden"
                            />
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center text-text-muted">
                                <Upload size={28} />
                            </div>
                            <h3 className="text-base font-bold text-text-main mb-1">
                                Click to choose or drag & drop file
                            </h3>
                            <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">
                                Supports <strong className="text-text-main">.json</strong> (recommended with variants & galleries) or <strong className="text-text-main">.csv</strong> files.
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 text-text-main text-xs font-semibold">
                                <Database size={14} className="text-primary" />
                                <span>Seamless import into PostgreSQL</span>
                            </div>
                        </div>
                    )}

                    {/* Parse Error Box */}
                    {parseError && (
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                            <div className="flex-1">
                                <strong className="block font-bold">Import Error:</strong>
                                <span>{parseError}</span>
                            </div>
                            <button onClick={handleReset} className="text-xs underline font-bold hover:text-red-900">Try Again</button>
                        </div>
                    )}

                    {/* Step 2: File Preview & Configuration */}
                    {file && parsedProducts.length > 0 && !importResult && (
                        <div className="space-y-4 animate-in fade-in">
                            {/* File summary bar */}
                            <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                        <FileText size={16} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-text-main">{file.name}</div>
                                        <div className="text-[11px] text-text-muted">{(file.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
                                >
                                    Change File
                                </button>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-center">
                                    <div className="text-xl font-bold text-blue-900">{parsedProducts.length}</div>
                                    <div className="text-[11px] text-blue-700 font-semibold uppercase tracking-wider">Total Products</div>
                                </div>
                                <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl text-center">
                                    <div className="text-xl font-bold text-purple-900">
                                        {parsedProducts.filter(p => p.variants && p.variants.length > 0).length}
                                    </div>
                                    <div className="text-[11px] text-purple-700 font-semibold uppercase tracking-wider">With Variants</div>
                                </div>
                                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center">
                                    <div className="text-xl font-bold text-emerald-900">
                                        {parsedProducts.filter(p => p.images && p.images.length > 0).length}
                                    </div>
                                    <div className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider">With Media</div>
                                </div>
                            </div>

                            {/* Overwrite Toggle */}
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                                <div>
                                    <span className="text-sm font-semibold text-text-main block">Update existing products</span>
                                    <span className="text-xs text-text-muted">If a product ID already exists in PostgreSQL, update it with new data</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={overwriteExisting}
                                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                            </div>

                            {/* Product Preview Table */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                                    Preview Products (First {Math.min(parsedProducts.length, 5)} of {parsedProducts.length})
                                </label>
                                <div className="border border-border/80 rounded-2xl overflow-hidden bg-white text-xs max-h-48 overflow-y-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 border-b border-border text-text-muted font-bold">
                                            <tr>
                                                <th className="p-2.5">Name</th>
                                                <th className="p-2.5">Category</th>
                                                <th className="p-2.5">Price</th>
                                                <th className="p-2.5">Stock</th>
                                                <th className="p-2.5">Variants</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60">
                                            {parsedProducts.slice(0, 5).map((p, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="p-2.5 font-semibold text-text-main max-w-[180px] truncate">
                                                        {p.name}
                                                    </td>
                                                    <td className="p-2.5 text-text-muted uppercase text-[11px]">
                                                        {p.category || '-'}
                                                    </td>
                                                    <td className="p-2.5 font-mono font-bold text-text-main">
                                                        ৳{p.price}
                                                    </td>
                                                    <td className="p-2.5 text-text-muted">
                                                        {p.stock_quantity}
                                                    </td>
                                                    <td className="p-2.5 text-text-muted">
                                                        {p.variants?.length ? `${p.variants.length} items` : 'None'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Success Result View */}
                    {importResult && (
                        <div className="space-y-4 animate-in zoom-in-95">
                            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                                    <CheckCircle2 size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-emerald-950 mb-1">
                                    Import Completed!
                                </h3>
                                <p className="text-xs text-emerald-800">
                                    Products have been successfully imported into your PostgreSQL database.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="text-2xl font-bold text-emerald-600">{importResult.inserted || 0}</div>
                                    <div className="text-xs text-text-muted font-semibold">New Products Added</div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="text-2xl font-bold text-blue-600">{importResult.updated || 0}</div>
                                    <div className="text-xs text-text-muted font-semibold">Existing Updated</div>
                                </div>
                            </div>

                            {importResult.errorsCount > 0 && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
                                    ⚠️ {importResult.errorsCount} row(s) had warnings or issues during import.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100 font-outfit shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:bg-gray-50 transition-colors"
                    >
                        {importResult ? 'Close' : 'Cancel'}
                    </button>

                    {parsedProducts.length > 0 && !importResult && (
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={isImporting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isImporting ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    <span>Importing to PostgreSQL...</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    <span>Start Import ({parsedProducts.length} Products)</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportProductsModal;
