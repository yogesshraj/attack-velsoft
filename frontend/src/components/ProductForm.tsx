import { useFormik } from 'formik';
import * as Yup from 'yup';
import { clsx } from 'clsx';

interface Product {
  id?: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  unitPrice: number;
  stockQuantity: number;
  reorderPoint: number;
}

interface ProductFormProps {
  initialValues?: Partial<Product>;
  onSubmit: (values: Partial<Product>) => void;
  isLoading?: boolean;
}

const productCategories = [
  'Electronics',
  'Clothing',
  'Food',
  'Furniture',
  'Books',
  'Sports',
  'Beauty',
  'Toys',
  'Automotive',
  'Other',
];

const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  description: Yup.string(),
  sku: Yup.string()
    .min(3, 'SKU must be at least 3 characters')
    .required('SKU is required'),
  category: Yup.string().required('Category is required'),
  unitPrice: Yup.number()
    .positive('Unit price must be positive')
    .required('Unit price is required'),
  stockQuantity: Yup.number()
    .integer('Stock quantity must be a whole number')
    .min(0, 'Stock quantity cannot be negative')
    .required('Stock quantity is required'),
  reorderPoint: Yup.number()
    .integer('Reorder point must be a whole number')
    .min(0, 'Reorder point cannot be negative')
    .required('Reorder point is required'),
});

export default function ProductForm({
  initialValues = {
    name: '',
    description: '',
    sku: '',
    category: '',
    unitPrice: 0,
    stockQuantity: 0,
    reorderPoint: 0,
  },
  onSubmit,
  isLoading = false,
}: ProductFormProps) {
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Name */}
        <div>
          <label htmlFor="name" className="label">
            Name
          </label>
          <input
            type="text"
            id="name"
            className={clsx(
              'input mt-1',
              formik.touched.name && formik.errors.name && 'border-red-500'
            )}
            {...formik.getFieldProps('name')}
          />
          {formik.touched.name && formik.errors.name && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.name}</p>
          )}
        </div>

        {/* SKU */}
        <div>
          <label htmlFor="sku" className="label">
            SKU
          </label>
          <input
            type="text"
            id="sku"
            className={clsx(
              'input mt-1',
              formik.touched.sku && formik.errors.sku && 'border-red-500'
            )}
            {...formik.getFieldProps('sku')}
          />
          {formik.touched.sku && formik.errors.sku && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.sku}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="label">
            Category
          </label>
          <select
            id="category"
            className={clsx(
              'input mt-1',
              formik.touched.category &&
                formik.errors.category &&
                'border-red-500'
            )}
            {...formik.getFieldProps('category')}
          >
            <option value="">Select a category</option>
            {productCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {formik.touched.category && formik.errors.category && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.category}</p>
          )}
        </div>

        {/* Unit Price */}
        <div>
          <label htmlFor="unitPrice" className="label">
            Unit Price
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
              type="number"
              id="unitPrice"
              className={clsx(
                'input pl-7',
                formik.touched.unitPrice &&
                  formik.errors.unitPrice &&
                  'border-red-500'
              )}
              step="0.01"
              {...formik.getFieldProps('unitPrice')}
            />
          </div>
          {formik.touched.unitPrice && formik.errors.unitPrice && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.unitPrice}</p>
          )}
        </div>

        {/* Stock Quantity */}
        <div>
          <label htmlFor="stockQuantity" className="label">
            Stock Quantity
          </label>
          <input
            type="number"
            id="stockQuantity"
            className={clsx(
              'input mt-1',
              formik.touched.stockQuantity &&
                formik.errors.stockQuantity &&
                'border-red-500'
            )}
            {...formik.getFieldProps('stockQuantity')}
          />
          {formik.touched.stockQuantity && formik.errors.stockQuantity && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.stockQuantity}
            </p>
          )}
        </div>

        {/* Reorder Point */}
        <div>
          <label htmlFor="reorderPoint" className="label">
            Reorder Point
          </label>
          <input
            type="number"
            id="reorderPoint"
            className={clsx(
              'input mt-1',
              formik.touched.reorderPoint &&
                formik.errors.reorderPoint &&
                'border-red-500'
            )}
            {...formik.getFieldProps('reorderPoint')}
          />
          {formik.touched.reorderPoint && formik.errors.reorderPoint && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.reorderPoint}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          className={clsx(
            'input mt-1',
            formik.touched.description &&
              formik.errors.description &&
              'border-red-500'
          )}
          {...formik.getFieldProps('description')}
        />
        {formik.touched.description && formik.errors.description && (
          <p className="mt-1 text-sm text-red-500">
            {formik.errors.description}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => formik.resetForm()}
        >
          Reset
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !formik.isValid}
        >
          {isLoading ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
} 