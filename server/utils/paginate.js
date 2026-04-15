const paginate = async (model, { filter = {}, sort = { createdAt: -1 }, page, limit, populate, select }) => {
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const skip = (p - 1) * l;

    let query = model.find(filter).sort(sort).skip(skip).limit(l);
    if (populate) query = query.populate(populate);
    if (select) query = query.select(select);

    const [data, total] = await Promise.all([
        query.exec(),
        model.countDocuments(filter)
    ]);

    return {
        data,
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
    };
};

const buildSearchFilter = (search, fields) => {
    if (!search) return {};
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return { $or: fields.map((f) => ({ [f]: rx })) };
};

module.exports = { paginate, buildSearchFilter };
