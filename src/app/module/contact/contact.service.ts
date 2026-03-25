import { prisma } from '../../lib/prisma';

const createMessage = async (data: { name: string; email: string; subject?: string; message: string }) => {
    return await prisma.contact.create({
        data,
    });
};

const getAllMessages = async () => {
    return await prisma.contact.findMany({
        orderBy: { createdAt: 'desc' },
    });
};

const deleteMessage = async (id: string) => {
    return await prisma.contact.delete({
        where: { id },
    });
};

export const ContactService = {
    createMessage,
    getAllMessages,
    deleteMessage,
};
