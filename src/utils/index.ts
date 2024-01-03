// Delete unnecessary mongodb fields
export const deleteFields = (data: object, moreFields?: string[]): void => {
  let fields = ['__v', 'updatedAt'];

  if (moreFields) {
    fields = [...fields, ...moreFields];
  }

  fields.forEach((field) => delete data[field as keyof object]);
};
