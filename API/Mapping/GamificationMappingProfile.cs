using API.Dtos;
using API.Entities;
using AutoMapper;

namespace API.Mapping;

public class GamificationMappingProfile : Profile
{
    public GamificationMappingProfile()
    {
        CreateMap<XPTransaction, XPTransactionDto>();
        CreateMap<Badge, BadgeDto>();
    }
}
